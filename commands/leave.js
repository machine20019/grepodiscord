"use strict"

var util = require('util');

module.exports = {
  name: "leave",
  description: "Tells the bot to leave the server. Type the server name to confirm.",
  usage: "!leave <server name>",
  permissions: "manageServer",
  callback: function (msg, command, args) {
    var bot = this.bot,
        chatLog = this.chatLog;

    if (!args.length) {
      var msgArray = [];
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      return bot.sendMessage(msg.channel, msgArray);
    }

    if (args[0] !== bot.user.username) {
      return bot.sendMessage(msg.channel, "The argument provided does not match the bot username.");
    }

    if (!msg.channel.server) {
      bot.sendMessage(msg.channel, "I can't leave a DM. Please use this command in a channel.");
      return;
    }

    if (!msg.channel.permissionsOf(msg.sender).hasPermission("manageServer")) {
      bot.sendMessage(msg.channel, "You don't have the permissions to use this command.");
      chatLog("Warn", util.format("A non-privileged user (%s) tried to make me leave a server (%s)", msg.sender.username, server.name));
      return;
    }

    bot.sendMessage(msg.channel, "See ya!", function () {
      bot.leaveServer(msg.channel.server);
      chatLog("Info", util.format("Left server: %s requested by %s", msg.channel.server.name, msg.sender.mention()));
    });
  }
};