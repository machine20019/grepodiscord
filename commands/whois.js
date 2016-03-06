"use strict"

var util = require('util');

module.exports = {
  name: "whois",
  description: "Get user information.",
  usage: "!whois <user mention>",
  example: "!whois @Lance",
  permissions: "manageServer",
  callback: function (msg, command, args) {
    var bot = this.bot;

    if (!args.length) {
      var msgArray = [];
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      msgArray.push(util.format("Example: %s", module.exports.example));
      return bot.sendMessage(msg.channel, msgArray);
    }

    if (!msg.channel.server) {
      return bot.sendMessage(msg.author, "I can't do that in DM");
    }

    if (msg.mentions.length === 0) {
      return bot.sendMessage(msg.channel, "Please mention the user.");
    }

    msg.mentions.map(function (user) {
      var msgArray = [];
      msgArray.push("");
      msgArray.push(util.format("User: `%s`", user.username));
      msgArray.push(util.format("ID: `%s`", user.id));
      msgArray.push(util.format("Status: `%s`", user.status));
      bot.sendMessage(msg.channel, msgArray);
    });
  }
};