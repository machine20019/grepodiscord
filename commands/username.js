"use strict"

var util = require('util'),
    email;

module.exports = {
  name: "username",
  description: "Changes the bot username.",
  usage: "!username <current username> <new username>",
  permissions: "admin",
  callback: function (msg, command, args) {
    var bot = this.bot,
        config = this.config,
        chatLog = this.chatLog;

    if (!args.length || args[0] !== bot.user.username) {
      var msgArray = [];
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      return bot.sendMessage(msg.channel, msgArray);
    }

    if (args[1].length) {
      email = config.email;
      bot.setUsername(args[1], function (err) {
        if (err) {
          return chatLog("Error", util.format("Failed to set username to: %s requested by %s", args[1], msg.author));
        }
        bot.sendMessage(msg.channel, util.format("Username changed to %s", args[1]));
        chatLog("Info", util.format("Set username: %s requested by %s", args[1], msg.author));
      })
    }
  }
};