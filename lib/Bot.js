"use strict";

const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const moment = require('moment');
const config = require('./config');
const logger = require('./logger');
const models = require('../models');
const Discord = require('discord.js');
const Database = require('./Database');

const bot = new Discord.Client();

class Bot {

  /**
   * Bot constructor
   * @param  {Object} config Configuration object
   */
  constructor() {
    this.commands = {};
    this.modules = {};
    this.bot = bot;
    this.prefixes = ['?'];
    
    if (config.prefixes) {
      this.prefixes = (typeof config.prefixes === 'string') ? 
        config.prefixes.split(',') : config.prefixes;
    }
    
    bot.db = new Database();

    this.loadCommands();
    this.loadModules();
    this.login();
    
    if (config.logLevel === 'silly') {
      logger.silly("Let's make the bot explode.");
      logger.warn("The bot may explode.");
      logger.error("The bot is exploding!");
      logger.silly("Just kidding! XD");
    }

    bot.on("ready", this.ready.bind(this));
    bot.on("info", this.info.bind(this));
    bot.on("error", this.error.bind(this));
    bot.on("message", this.onMessage.bind(this));
    bot.on("disconnected", this.disconnect.bind(this));
    bot.on("serverNewMember", this.userJoin.bind(this));
    bot.on("serverMemberRemoved", this.userLeave.bind(this));
    bot.on("serverCreated", this.serverCreated.bind(this));
    
    // if (config.logLevel === 'debug') {
      bot.on("warn", this.warn.bind(this));
    // }
    
    // Debugging only
    // bot.on("debug", this.debug.bind(this));
    // bot.on("raw", this.debug.bind(this));
    return bot;
  }

  /**
   * Load commands
   */
  loadCommands() {
    utils.readdirRecursive(config.commandPath, (files) => {
      for (let file of files) {
        let name = file.replace('.js', '');
        this.registerCommand(require(file));
      }
    });
  }

  /**
   * Register command
   * @param  {Object} Command
   */
  registerCommand(Command) {
    if (typeof Command !== 'function') {
      logger.debug("Skipping unknown command");
      return;
    }
    
    let command = new Command(config);
    command.name = command.aliases[0];
    
    logger.debug("Registering command: %s", command.name);
    
    if (command.aliases && command.aliases.length) {
      for (let alias of command.aliases) {
        logger.debug("Registering alias %s for %s", alias, command.name);
        this.commands[alias] = command;
      }
    }
  }

  /**
   * Unregister command
   * @param  {String} name Command name
   */
  unregisterCommand(name) {
    logger.debug("Unregistering command: %s", name);
    try {
      delete this.commands[name];
    } catch (e) {
      return;
    }
  }
  
  /**
   * Load modules
   */
  loadModules() {
    utils.readdirRecursive(config.modulePath, (files) => {
      for (let file of files) {
        let name = file.replace('.js', '');
        this.registerModule(require(file));
      }
    });
  }
  
  /**
   * Register module
   * @param  {Object} module
   */
  registerModule(Module) {
    if (typeof Module !== 'function') {
      logger.debug("Skipping unknown module");
      return;
    }
    
    logger.debug("Registering module: %s", Module.name);
    
    this.modules[Module.name] = new Module(config);
    this.modules[Module.name].start(bot);
  }

  /**
   * Login to Discord
   */
  login() {
    if (config.self || !config.botToken || !config.botToken.length) {
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
    logger.info("Attempting to reconnect...");
    return this.login();
  }

  /**
   * Ready event handler
   */
  ready() {
    let server = bot.servers.get("id", config.botServerId);
    
    if (!server) return;
    
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
    
    if (!config.botServerId || server.id !== config.botServerId) return;
    
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
    bot.db.auth.find({}, (err, docs) => {
      if (err) return this.dbError(err);
      config.authList = docs;
    });
    
    // get worlds from db
    bot.db.worlds.find({}, (err, docs) => {
      if (err) return this.dbError(err);
      config.worlds = docs;
    });
  }

  /**
   * Log output with level and message
   * @param  {String} level   Level to log
   * @param  {String} message Message to log
   */
  log(level, message) {
    if (!config.logChannel) return;

    message = `[${level}]: ${message}`;
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

    if (!serverChannel) return;
    
    bot.sendMessage(serverChannel, `${user.username} joined ${server.name}`);
  }

  /**
   * userLeave event handler
   * @param  {Object} server Server object
   * @param  {Object} user   User object
   */
  userLeave(server, user) {
    var serverChannel = _.findWhere(server.channels, { name: 'server' });

    if (!serverChannel) return;
    
    bot.sendMessage(serverChannel, `${user.username} left ${server.name}`);
  }

  /**
   * Generate help command output
   * 
   * @param  {Object} msg  Message resolvable
   * @param  {Object} userAuth  User permissions
   */
  generateHelp(msg, args, userAuth) {
    let msgArray = [],
        commands = _.clone(this.commands),
        isAdmin = (userAuth && userAuth.admin === true),
        isServerManager = (msg.channel.permissionsOf(msg.author).hasPermission("manageServer"));
        
    // filter commands
    commands = _.values(commands).filter(o => { return (!o.hideFromHelp && !o.disabled); });
    
    // filter out admin commands
    if (!isAdmin) {
      commands = commands.filter(o => { return (o.permissions !== 'admin'); });
    }
    
    // filter out server manager commands
    if (!isAdmin && !isServerManager) {
      commands = commands.filter(o => { return (o.permissions !== 'manageServer'); });
    }
    
    // group commands and remove duplicates
    commands = _.groupBy(_.uniq(commands), 'group');

    msgArray.push("```xl");
    
    for (let group of Object.keys(commands)) {
      let cmds = commands[group];
      
      msgArray.push(`${group}:`);
      
      for (let cmd of cmds) {
        msgArray.push(`  ${utils.pad(cmd.name, 15)} ${cmd.description}`);
      }
    }

    msgArray.push("```");
    
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

    // if (msg.mentions.length > 0 && msg.mentions[0] === bot.user) {
    //   cmd = params[1];
    //   args = params.slice(2);
    //   commandIsMention = true;
    // } else {
    cmd = params.slice(0,1)[0].substring(1).toLowerCase();
    args = params.slice(1);
    // }

    // Ignore commands in DM
    if (!msg.channel.server) return;

    // ignore own messages
    if (msg.author.equals(bot.user)) return;

    // command doesn't exist
    if (cmd !== 'help' && !(cmd.toLowerCase() in this.commands)) return;

    // filter messages that are not commands
    if (!commandIsMention && this.prefixes.indexOf(msg.content[0]) === -1) return;

    let userAuth = _.findWhere(config.authList, { _id: msg.author.id });

    // user is banned
    if (userAuth && userAuth.banned === true) return;

    // display help
    if (cmd === 'help') {
      let help = this.generateHelp(msg, args, userAuth);
      return bot.sendMessage(msg.channel, help);
    }

    command = this.commands[cmd];

    // ignore commands based on permissions
    if (command.permissions === "manageServer" && 
      !msg.channel.permissionsOf(msg.author).hasPermission("manageServer")) return;
    
    // ignore admin commands for users without rights
    if (command.permissions === "admin" && (!userAuth || userAuth.admin !== true)) return;

    // execute command
    command.execute(msg, args, cmd);

    this.log(msg, cmd, args);
  }

}

module.exports = Bot;
