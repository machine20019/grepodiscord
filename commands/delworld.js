"use strict"

var util = require('util'),
    models = require('../models');

module.exports = {
  name: "delworld",
  description: "Deletes a world from supported worlds.",
  usage: "!delworld <world id>",
  example: "!delworld us46",
  permissions: "admin",
  callback: function (msg, command, args) {
    var bot = this.bot,
        config = this.config,
        chatLog = this.chatLog;

    if (!args.length || args[0].length !== 4) {
      var msgArray = [];
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      msgArray.push(util.format("Example: %s", module.exports.exampls));
      return bot.sendMessage(msg.channel, msgArray);
    }

    models.Servers
      .destroy({
        where: { server: args[0] }
      })
      .then(function () {
        models.Servers.findAll({}).then(function (serverList) {
          // update server list
          config.serverList = serverList;
          
          bot.sendMessage(msg.channel, util.format("Deleted world %s", args[0]));
          chatLog("Info", util.format("World added: %s", args[0]));
        });
      });
  }
};