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

  /**
   * Bot constructor
   * @param  {Object} config Configuration object
   */
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
    bot.on("warn", this.warn.bind(this));
    bot.on("info", this.info.bind(this));
    bot.on("error", this.error.bind(this));
    bot.on("disconnected", this.disconnect.bind(this));
    bot.on("message", this.onMessage.bind(this));
    bot.on("serverNewMember", this.userJoin.bind(this));
    bot.on("serverMemberRemoved", this.userLeave.bind(this));
    bot.on("serverRoleUpdated", this.roleUpdate.bind(this));
    
    // Debugging only
    // bot.on("debug", this.debug.bind(this));
    // bot.on("raw", this.debug.bind(this));
  }

  /**
   * Login to Discord
   */
  login () {
    return bot.loginWithToken(this.config.botToken)
      .then(this.init.bind(this))
      .catch(this.error.bind(this));
  }

  /**
   * Disconnect handler
   * Attempts to reconnect to discord.
   */
  disconnect () {
    logger.warn("Disconnected");
    return this.reconnect();
  }

  /**
   * Attempt to reconnect to Discord
   */
  reconnect () {
    logger.info("Attempting to reconnect...");
    return this.login();
  }

  /**
   * Ready event handler
   * Starts the bot monitor
   */
  ready () {
    let config = this.config;

    config.botServer = bot.servers.get("id", config.botServerId);
    config.logChannel = config.botServer.channels.get("id", config.logChannelId);
    
    logger.info("Bot Connected as %s (%s) on %d servers\n", bot.user.username, bot.user.id, bot.servers.length);
    logger.info("Bot Server: %s (%s)", config.botServer.name, config.botServer.id);
    logger.info("Bot Log Channel: %s (%s)\n", config.logChannel.name, config.logChannel.id);

    if (this.config.monitorEnabled) {
      monitor.start(config, bot);
    }
  }

  /**
   * initialize the bot
   * @param  {String} token Login token
   */
  init (token) {
    logger.info('Bot logged in with token %s', token);

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

  /**
   * Log output with level and message
   * @param  {String} level   Level to log
   * @param  {String} message Message to log
   */
  log (level, message) {
    let msg = util.format("[%s]: %s", level, message);
    this.config.logChannel.sendMessage(msg);
  }

  /**
   * discord.js info handler
   * @param  {String} message Message to log
   */
  info (message) {
    return logger.info(message);
  }

  /**
   * discord.js warn handler
   * @param  {String} message Message to log
   */
  warn (message) {
    return logger.warn(message);
  }

  /**
   * discord.js error handler
   * @param  {String} message Message to log
   */
  error (message) {
    return logger.error(message);
  }

  /**
   * Database error handler
   * @param  {Object} error Error object
   */
  dbError(error) {
    logger.error("DB Error: %s\n%s", error.name, error.stack);
  }

  /**
   * userJoin event handler
   * @param  {Object} server Server object
   * @param  {Object} user   User object
   */
  userJoin (server, user)  {
    let serverChannel = _.findWhere(server.channels, { name: 'server' });
    
    if (!serverChannel) {
      return;
    }
    
    bot.sendMessage(serverChannel, util.format("%s joined %s", user.username, server.name));
  }

  /**
   * userLeave event handler
   * @param  {Object} server Server object
   * @param  {Object} user   User object
   */
  userLeave (server, user) {
    var serverChannel = _.findWhere(server.channels, { name: 'server' });

    if (!serverChannel) {
      return;
    }
    
    bot.sendMessage(serverChannel, util.format("%s left %s", user.username, server.name));
  }

  roleUpdate (server, role) {
    console.log(role.colorAsHex());
  }

  /**
   * onMessage event handler
   * @param  {Object} msg Message object
   */
  onMessage (msg) {

    let serverId = (msg.channel.server) ? msg.channel.server.id : null,
        channel = msg.channel,
        params = msg.content.split(' '),
        cmd = params.slice(0,1)[0].substring(1).toLowerCase(),
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

    if (cmd !== 'help' && !(cmd in this.commands)) {
      return;
    }

    // filter messages that are not commands
    if (msg.author.id != bot.user.id && (['!','.'].indexOf(msg.content[0]) !== -1)) {

      let userAuth = _.findWhere(config.authList, { id: msg.author.id });

      // user is banned from using the bot
      if (userAuth && userAuth.banned === true) {
        return;
      }

      // display help
      if (cmd === 'help') {
        
        let msgArray = [],
            chain = _.chain(this.commands),
            base = chain.reject(o => { return o.permissions || o.hideFromHelp || o.disabled; }).pluck('name').value(),
            mgr = chain.where({ permissions: "manageServer" }).pluck('name').value(),
            admin = chain.where({ permissions: "admin" }).pluck('name').value();

        let baseGroup = _.groupBy(base, function(item, i) {
          return Math.floor(i/5);
        });
        baseGroup = _.values(baseGroup);

        msgArray.push(util.format("```xl\nCommands:"));
        _.each(baseGroup, (base) => {
          msgArray.push(util.format("\t%s", base.join(", ")));
        });

        // server manager commands
        if (msg.channel.permissionsOf(msg.sender).hasPermission("manageServer") || (userAuth && userAuth.admin === true)) {
          msgArray.unshift(""); // drop an empty line for uniformity
          msgArray.push(util.format("More Commands:\n\t%s", mgr.join(", ")));
        }

        // bot admin commands
        if (userAuth && userAuth.admin === true && args[0] === 'all') {
          msgArray.push(util.format("Admin Commands:\n\t%s", admin.join(", ")));
        }

        msgArray.push('```');

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

module.exports = Bot;
