"use strict";

const util = require('util');
const pkg = require('../package.json');
const config = require('../lib/config');

module.exports = {
  name: "info",
  description: "Get bot info/stats.",
  usage: "info",
  hideFromHelp: true,
  callback: function (msg, command, args) {
    let bot = this.bot,
        msgArray = [];

    msgArray.push("```xl");
    msgArray.push(util.format("GrepoDiscord  | %s", config.version));
    msgArray.push(util.format("GitHub        | %s", pkg.homepage));
    msgArray.push("Author        | NoobLance");
    msgArray.push(util.format("Servers       | %d", bot.servers.length));
    msgArray.push(util.format("Channels      | %d", bot.channels.length));
    msgArray.push("```");
    this.bot.sendMessage(msg.channel, msgArray);
  }
};