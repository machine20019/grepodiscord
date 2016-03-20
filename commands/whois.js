"use strict";

const util = require('util');

module.exports = {
  name: "whois",
  description: "Get user information.",
  usage: "!whois <user mention>",
  example: "!whois @Lance",
  permissions: "manageServer",
  callback: function (msg, command, args) {
    let bot = this.bot;

    if (!args.length) {
      let msgArray = [];
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

    msg.mentions.map(user => {
      let msgArray = [];
      msgArray.push("");
      msgArray.push(util.format("User: `%s`", user.username));
      msgArray.push(util.format("ID: `%s`", user.id));
      msgArray.push(util.format("Status: `%s`", user.status));
      bot.sendMessage(msg.channel, msgArray);
    });
  }
};