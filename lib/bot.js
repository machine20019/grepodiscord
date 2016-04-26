"use strict";

const _ = require('underscore');
const fs = require('fs');
const util = require('util');
const moment = require('moment');
const config = require('./config');
const logger = require('./logger');
const models = require('../models');
const monitor = require('./monitor');
const watcher = require('./watcher');
const reload = require('require-reload')(require);
const Discord = require('discord.js');

let bot = new Discord.Client();

class Bot {

  /**
   * Bot constructor
   * @param  {Object} config Configuration object
   */
  constructor() {
    this.commands = {};
    this.bot = bot;
    this.monitor = monitor;
    this.prefixes = ['?','.'];

    this.loadCommands();

    // connect to db and discord.
    models.sequelize.sync()
      .then(this.login.bind(this))
      .catch(this.dbError.bind(this));

    bot.on("ready", this.ready.bind(this));
    bot.on("warn", this.warn.bind(this));
    bot.on("info", this.info.bind(this));
    bot.on("error", this.error.bind(this));
    bot.on("message", this.onMessage.bind(this));
    bot.on("disconnected", this.disconnect.bind(this));
    bot.on("serverNewMember", this.userJoin.bind(this));
    bot.on("serverMemberRemoved", this.userLeave.bind(this));
    bot.on("serverCreated", this.serverCreated.bind(this));
    
    // Debugging only
    // bot.on("debug", this.debug.bind(this));
    // bot.on("raw", this.debug.bind(this));
    return bot;
  }

  /**
   * Load commands
   */
  loadCommands() {
    fs.readdirSync(config.commandPath).forEach(file => {
      let name = file.replace('.js', ''),
          filepath = config.commandPath + "/" + file;

      this.registerCommand(reload(filepath));
    });

    // register event listener
    watcher.on("reload", this.registerCommand.bind(this));
    watcher.on("unlink", this.unregisterCommand.bind(this));
  }

  /**
   * Register command
   * @param  {Object} cmd Command
   */
  registerCommand(cmd) {
    logger.debug("Registering command: %s", cmd.name);
    this.commands[cmd.name] = cmd;
    if (cmd.aliases && cmd.aliases.length) {
      for (let i = 0; i < cmd.aliases.length; i++) {
        logger.debug("Registering alias %s for %s", cmd.aliases[i], cmd.name);
        this.commands[cmd.aliases[i]] = cmd;
      }
    }
  }

  /**
   * Unregister command
   * @param  {String} name Command name
   */
  unregisterCommand(name) {
    logger.debug("Unregistering command: %s", name);
    delete this.commands[name];
  }

  /**
   * Login to Discord
   */
  login() {
    if (!config.botToken || !config.botToken.length) {
      if (!config.email.length || !config.password.length) {
        return logger.error('OAuth Token or Email/Password must be set in .env');
      }
      
      // login with email/password
      return bot.login(config.email, config.password)
        .then(this.init.bind(this))
        .catch(this.error.bind(this));
    }
    
    // login with oauth token
    return bot.loginWithToken(config.botToken)
      .then(this.init.bind(this))
      .catch(this.error.bind(this));
  }

  /**
   * Disconnect handler
   * Attempts to reconnect to discord.
   */
  disconnect() {
    logger.warn("Disconnected");
    return this.reconnect();
  }

  /**
   * Attempt to reconnect to Discord
   */
  reconnect() {
    logger.info("Attempting to reconnect...");
    return this.login();
  }

  /**
   * Ready event handler
   * Starts the bot monitor
   */
  ready() {
    let server = bot.servers.get("id", config.botServerId);
    
    if (config.monitorEnabled) {
      this.monitor.start(bot);
    }
    
    if (!server) {
      return;
    }
    
    config.botServer = server;
    logger.info("Bot Server: %s (%s)", config.botServer.name, config.botServer.id);
    
    if (config.logChannelId) {
      config.logChannel = server.channels.get("id", config.logChannelId);
      logger.info("Bot Log Channel: %s (%s)\n", config.logChannel.name, config.logChannel.id);
    }
  }

  /**
   * Server created event handler
   * @param  {Object} server Instance of server
   */
  serverCreated(server) {
    logger.debug("Server added: %s (%s)", server.name, server.id);
    
    if (!config.botServerId || server.id !== config.botServerId) {
      return;
    }
    
    config.botServer = bot.servers.get("id", config.botServerId);
    logger.info("Bot Server: %s (%s)", config.botServer.name, config.botServer.id);
    
    if (config.logChannelId) {
      config.logChannel = server.channels.get("id", config.logChannelId);
      logger.info("Bot Log Channel: %s (%s)\n", config.logChannel.name, config.logChannel.id);
    }
  }

  /**
   * initialize the bot
   * @param  {String} token Login token
   */
  init(token) {
    token = Array(token.length-6).join("*") + token.substring(token.length-6);
    logger.info('Bot logged in with token %s', token);

    // get user permissions from db
    models.Auth.findAll({})
    .then(authList => {
      config.authList = authList.map(row => { return row.toJSON(); });
    }).catch(this.dbError);

    // get servers from db
    models.Servers.findAll({})
    .then(servers => {
      config.servers = servers.map(o => { return o.toJSON(); });
    }).catch(this.dbError);
  }

  /**
   * Log output with level and message
   * @param  {String} level   Level to log
   * @param  {String} message Message to log
   */
  log(level, message) {
    if (!config.logChannel) {
      return;
    }

    message = util.format("[%s]: %s", level, message);
    config.logChannel.sendMessage(message);
  }

  chatLog(level, message) {
    return this.log(level, message);
  }

  /**
   * discord.js info handler
   * @param  {String} message Message to log
   */
  info(message) {
    return logger.info(message);
  }

  /**
   * discord.js debug handler
   * @param  {String} message Message to log
   */
  debug(message) {
    return logger.debug(message);
  }

  /**
   * discord.js warn handler
   * @param  {String} message Message to log
   */
  warn(message) {
    return logger.warn(message);
  }

  /**
   * discord.js error handler
   * @param  {String} message Message to log
   */
  error(message) {
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
  userJoin(server, user)  {
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
  userLeave(server, user) {
    var serverChannel = _.findWhere(server.channels, { name: 'server' });

    if (!serverChannel) {
      return;
    }
    
    bot.sendMessage(serverChannel, util.format("%s left %s", user.username, server.name));
  }

  /**
   * Generate help command output
   * 
   * @param  {Object} msg  Message resolvable
   * @param  {Object} userAuth  User permissions
   */
  generateHelp(msg, userAuth) {
    let msgArray = [],
        chain = _.chain(this.commands),
        
        // get base commands
        base = chain.reject(o => {
          return o.permissions || o.hideFromHelp || o.disabled;
        }).pluck('name').uniq().value(),
        
        // get server manager commands
        mgr = chain.where({ permissions: "manageServer" })
          .pluck('name').uniq().value(),
        
        // get admin commands
        admin = chain.where({ permissions: "admin" })
          .pluck('name').uniq().value();

    // avoid break-word word wrapping by displaying 5 commands per line
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
    
    return msgArray;
  }

  /**
   * onMessage event handler
   * @param  {Object} msg Message object
   */
  onMessage(msg) {
    let serverId = (msg.channel.server) ? msg.channel.server.id : null,
        channel = msg.channel,
        params = msg.cleanContent.split(' '),
        overrides = ['leave'],
        cmd = '',
        args = [],
        command = {},
        commandIsMention = false,
        msgContent = msg.cleanContent;

    if (msg.mentions.length > 0) {
      if (msg.mentions[0]  == bot.user) {
        cmd = params[1];
        args = params.slice(2);
        commandIsMention = true;
      }
    } else {
      cmd = params.slice(0,1)[0].substring(1).toLowerCase();
      args = params.slice(1);
    }

    // Ignore commands in DM
    if (!msg.channel.server) {
      return;
    }

    // Ignore commands if not in bot channel, don't ignore join/leave commands
    // if ((channel.name !== 'bot' && channel.name !== 'server') || overrides.indexOf(cmd) !== -1) {
    //   if (serverId !== config.botServerId) {
    //     return;
    //   }
    // }

    // ignore own messages
    if (msg.author == bot.user) {
      return;
    }

    if (cmd !== 'help' && !(cmd in this.commands)) {
      return;
    }

    // filter messages that are not commands
    if (msg.author.id != bot.user.id && (commandIsMention || this.prefixes.indexOf(msg.content[0]) !== -1)) {

      let userAuth = _.findWhere(config.authList, { id: msg.author.id });

      // user is banned from using the bot
      if (userAuth && userAuth.banned === true) {
        return;
      }

      // display help
      if (cmd === 'help') {
        let help = this.generateHelp(msg, userAuth);

        bot.sendMessage(msg.channel, help);
        
        this.log(msg, cmd, args);
        return;
      }

      command = this.commands[cmd];

      // ignore commands based on permissions
      if ( (command.permissions === "manageServer" && 
          !msg.channel.permissionsOf(msg.sender).hasPermission("manageServer")) || 
        (!userAuth || userAuth.admin !== true) ) { return; }

      // execute command
      command.callback.call(this, msg, cmd, args);

      this.log(msg, cmd, args);
    }
  }

}

module.exports = Bot;
