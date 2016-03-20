"use strict";

const _ = require('underscore');
const util = require('util');

module.exports = {
  name: "botservers",
  description: "Gets a list of servers the bot is in.",
  usage: "!botservers",
  permissions: "admin",
  callback: function (msg, command, args) {
    let bot = this.bot,
        servers = bot.servers,
        msgArray = [];

    servers = servers.map(o => {
      return { id: o.id, name: o.name };
    });

    msgArray.push("Bot Servers:");

    _.each(servers, o => {
      msgArray.push(util.format("%s (%s)", o.name, o.id));
    });

    bot.sendMessage(msg.channel, msgArray);
  }
};