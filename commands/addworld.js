"use strict"

var util = require('util'),
    models = require('../models');

module.exports = {
  name: "addworld",
  description: "Adds a world to be monitored.",
  usage: "!addworld <world name> <world id>",
  example: "!addworld baris us46",
  permissions: "admin",
  callback: function (msg, command, args) {
    var bot = this.bot,
        config = this.config,
        chatLog = this.chatLog;

    if (!args.length || args.length < 2 || args[1].length !== 4) {
      var msgArray = [];
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      msgArray.push(util.format("Example: %s", module.exports.example));
      return bot.sendMessage(msg.channel, msgArray);
    }

    models.Servers
      .build({
        server: args[1],
        name: args[0]
      })
      .save()
      .then(function () {
        models.Servers.findAll({}).then(function (serverList) {
          // update server list
          config.serverList = serverList;
          
          bot.sendMessage(msg.channel, util.format("Added world %s (%s)", args[0], args[1]));
          chatLog("Info", util.format("World added: %s (%s)", args[0], args[1]));
        });
      });
  }
};