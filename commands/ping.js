"use strict";

module.exports = {
  name: "ping",
  description: "Ping the bot.",
  usage: "!ping",
  hideFromHelp: true,
  callback: function (msg, command, args) {
    this.bot.sendMessage(msg.channel, "Pong!");
  }
};