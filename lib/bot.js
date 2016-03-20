"use strict";

const _ = require('underscore');
const fs = require('fs');
const util = require('util');
const moment = require('moment');
const logger = require('./logger');
const models = require('../models');
const monitor = require('./monitor');
const Discord = require('discord.js');

let bot = new Discord.Client();

class Bot {

  constructor (config) {
    this.config = config;
    this.commands = {};

    // load commands
    fs.readdirSync(config.commandPath).forEach(file => {
      let name = file.replace('.js', ''),
          filepath = config.commandPath + "/" + file;

      this.commands[name] = require(filepath);
    });

    // connect to db and discord.
    models.sequelize.sync()
      .then(this.login.bind(this))
      .catch(this.dbError.bind(this));

    bot.on("ready", this.ready.bind(this));
    bot.on("disconnected", this.disconnect.bind(this));
    bot.on("message", this.onMessage.bind(this));
    bot.on("serverNewMember", this.userJoin.bind(this));
    bot.on("serverMemberRemoved", this.userLeave.bind(this));
  }

  // bot login
  login () {
    return bot.login(this.config.email, this.config.password).then(this.init.bind(this));
  }

  // bot reconnect
  reconnect () {
    logger.info("Attempting to reconnect...");
    return this.login();
  }

  // log message to channel
  log (level, message) {
    let msg = util.format("[%s]: %s", level, message);
    return this.config.logChannel.sendMessage(msg);
  }

  // handle db errors
  dbError(error) {
    logger.error("DB Error: %s\n%s", error.name, error.stack);
  }

  // initialize bot
  init () {
    // get user permissions from db
    models.Auth.findAll({})
    .then(authList => {
      this.config.authList = authList.map(row => { return row.toJSON(); });
    }).catch(this.dbError);

    // get servers from db
    models.Servers.findAll({})
    .then(servers => {
      this.config.servers = servers.map(o => { return o.toJSON(); });
    }).catch(this.dbError);
  }

  // handle bot connected
  ready () {
    let config = this.config;

    // join bot server if not already there.
    bot.joinServer(config.defaultServer);
    config.botServer = bot.servers.get("id", config.botServerId);
    config.logChannel = config.botServer.channels.get("id", config.logChannelId);
    
    logger.info("Bot Connected as %s (%s) on %d servers\n", bot.user.username, bot.user.id, bot.servers.length);
    logger.info("Bot Server: %s (%s)", config.botServer.name, config.botServer.id);
    logger.info("Bot Log Channel: %s (%s)\n", config.logChannel.name, config.logChannel.id);

    monitor.start(config, bot);
  }

  // handle bot disconnect
  disconnect () {
    logger.warn("Disconnected");
    return this.reconnect();
  }

  // handle user joining server
  userJoin (server, user)  {
    let serverChannel = _.findWhere(server.channels, { name: 'server' });
    
    if (!serverChannel) {
      return;
    }
    
    bot.sendMessage(serverChannel, util.format("%s joined %s", user.username, server.name));
  }

  // handle user leaving server
  userLeave (server, user) {
    var serverChannel = _.findWhere(server.channels, { name: 'server' });

    if (!serverChannel) {
      return;
    }
    
    bot.sendMessage(serverChannel, util.format("%s left %s", user.username, server.name));
  }

  onMessage (msg) {

    let serverId = (msg.channel.server) ? msg.channel.server.id : null,
        channel = msg.channel,
        params = msg.content.split(' '),
        cmd = params.slice(0,1)[0].replace(/^\!/, '').toLowerCase(),
        args = params.slice(1),
        overrides = ['join', 'leave'],
        config = this.config,
        command = {};

    // Ignore commands in DM
    if (!msg.channel.server) {
      return;
    }

    // Ignore commands if not in bot channel, don't ignore join/leave commands
    if ((channel.name !== 'bot' && channel.name !== 'server') || overrides.indexOf(cmd) !== -1) {
      if (serverId !== config.botServerId) {
        return;
      }
    }

    // ignore own messages
    if (msg.author == bot.user) {
      return;
    }

    // filter messages that are not commands
    if (msg.author.id != bot.user.id && (['!','>'].indexOf(msg.content[0]) !== -1)) {

      let userAuth = _.findWhere(config.authList, { id: msg.author.id });

      // user is banned from using the bot
      if (userAuth && userAuth.banned === true) {
        return;
      }

      // display help
      if (cmd === 'help') {
        
        let msgArray = [],
            chain = _.chain(this.commands),
            base = chain.reject(o => { return o.permissions; }).pluck('name').value(),
            mgr = chain.where({ permissions: "manageServer" }).pluck('name').value(),
            admin = chain.where({ permissions: "admin" }).pluck('name').value();

        msgArray.push(util.format("Commands: %s", base.join(", ")));

        // server manager commands
        if (msg.channel.permissionsOf(msg.sender).hasPermission("manageServer") || (userAuth && userAuth.admin === true)) {
          msgArray.unshift(""); // drop an empty line for uniformity
          msgArray.push(util.format("More Commands: %s", mgr.join(", ")));
        }

        // bot admin commands
        if (userAuth && userAuth.admin === true && args[0] === 'all') {
          msgArray.push(util.format("Admin Commands: %s", admin.join(", ")));
        }

        bot.sendMessage(msg.channel, msgArray);
        this.log(msg, cmd, args);

        return;
      }

      // build context to send to command handler
      let context = {
        bot: bot,
        config: config,
        chatLog: this.log
      };

      command = this.commands[cmd];

      console.log(command);

      // ignore commands based on permissions
      if ( command.permissions === "manageServer" && 
        !msg.channel.permissionsOf(msg.sender).hasPermission("manageServer") && 
        (!userAuth || userAuth.admin !== true) ) { return; }

      // execute command
      command.callback.call(context, msg, cmd, args);

      this.log(msg, cmd, args);
    }
  }

}

module.exports = (config) => {
  return new Bot(config);
};
