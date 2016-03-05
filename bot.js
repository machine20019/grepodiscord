"use strict"

var _ = require('underscore'),
    fs = require('fs'),
    util = require('util'),
    moment = require('moment'),
    models = require('./models'),
    Discord = require('discord.js'),
    bot = new Discord.Client(),
    commandPath = require("path").join(__dirname, "commands"),
    commands = {},
    commandList = {};

require('dotenv').load();

var config = {
  defaultServer: process.env.SERVER,
  email: process.env.BOT_EMAIL,
  password: process.env.BOT_PASSWORD,
  botServerId: process.env.BOT_SERVER_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,
  botServer: null,
  logChannel: null,
  pollInterval: 600,
  serverList: {}
};

// load commands
fs.readdirSync(commandPath).forEach(function(file) {
  var name = file.replace('.js', ''),
      filepath = commandPath + "/" + file;

  commands[name] = require(filepath);
});

commandList.default = _.reject(commands, function (o) { return o.permissions; });
commandList.manager = _.where(commands, { permissions: "manageServer" });
commandList.admin = _.where(commands, { permissions: "admin" });

bot.on("ready", function () {
  bot.joinServer(config.defaultServer);
  config.botServer = bot.servers.get("id", config.botServerId)
  config.logChannel = config.botServer.channels.get("id", config.logChannelId)
  console.log("Bot Server: ", config.botServer.name);
  console.log("Bot Log Channel: ", config.logChannel.name);
})

bot.on("disconnected", function () {
  console.log("Disconnected!");
  process.exit(0);
})

function init() {
  models.Auth.findAll({})
    .then(function (authList) {
      authList = authList.map(function (row) { return row.toJSON(); });  
      config.authList = authList;
    });

  models.Servers.findAll({})
    .then(function (serverList) {
      config.serverList = serverList.map(function (o) { return o.toJSON(); });
    });
}

function login() {
  bot.login(config.email, config.password).then(init);
}

function logMessage (msg, command, args) {
  config.logChannel.sendMessage(util.format("[%s/%s/%s]: %s %s", msg.channel.server.name, msg.channel.name, msg.author.name, command, JSON.stringify(args)));
}

function chatLog (level, error) {
  config.logChannel.sendMessage(util.format("[%s]: %s", level, error));
}

bot.on("message", function (msg) {
  var serverId = (msg.channel.server) ? msg.channel.server.id : null,
      channel = msg.channel,
      params = msg.content.split(' '),
      cmd = params.slice(0,1)[0].replace(/^\!/, '').toLowerCase(),
      args = params.slice(1),
      overrides = ['join', 'leave'],
      command = {};

  // Ignore commands in DM
  if (!msg.channel.server) {
    return;
  }

  // Ignore commands if not in bot channel, don't ignore join/leave commands
  if (channel.name !== 'bot' && overrides.indexOf(cmd) !== -1) {
    if (serverId !== config.botServerId) {
      return;
    }
  }

  if (msg.author == bot.user) {
    return;
  }

  // filter messages that are not commands
  if (msg.author.id != bot.user.id && (['!','>'].indexOf(msg.content[0]) !== -1)) {
    var userAuth = _.findWhere(config.authList, { id: msg.author.id });

    if (userAuth && userAuth.banned === true) {
      return;
    }

    // Display help
    if (cmd === 'help') {
      var msgArray = [],
          defaultList = _.pluck(commandList.default, "name"),
          managerList = _.pluck(commandList.manager, "name"),
          adminList = _.pluck(commandList.admin, "name");

      msgArray.push(util.format("Commands: %s", defaultList.join(", ")));

      // server manager commands
      if (msg.channel.permissionsOf(msg.sender).hasPermission("manageServer") || userAuth.admin === true) {
        msgArray.unshift("");
        msgArray.push(util.format("More Commands: %s", managerList.join(", ")));
      }

      // bot mod commnads
      // if (userAuth.length && (userAuth.mod === true || userAuth.admin === true)) {
      //   msgArray.push(util.format("Mod Commands: %s", modList.join(", ")));
      // }

      // bot admin commands
      if (userAuth && userAuth.admin === true) {
        msgArray.push(util.format("Admin Commands: %s", adminList.join(", ")));
      }

      bot.sendMessage(msg.channel, msgArray);
      logMessage(msg, cmd, args);

      return;
    }

    var cmdContext = {
      bot: bot,
      config: config,
      chatLog: chatLog
    };

    command = commands[cmd];

    // ignore commands based on permissions
    if (command.permissions === "manageServer" && !msg.channel.permissionsOf(msg.sender).hasPermission("manageServer") && (!userAuth || userAuth.admin !== true)) {
      return;
    }

    // execute command
    command.callback.call(cmdContext, msg, cmd, args);

    logMessage(msg, cmd, args);
  }
});

models.sequelize.sync().then(login);
