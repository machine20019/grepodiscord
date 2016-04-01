"use strict";

const util = require('util');
const moment = require('moment');

require("moment-duration-format");

module.exports = {
  name: "uptime",
  description: "Get bot uptime",
  usage: "!uptime",
  hideFromHelp: true,
  callback: function (msg, command, args) {
    let uptime = moment.duration(Math.round(process.uptime()), "seconds").format();
    this.bot.sendMessage(msg.channel, util.format("Uptime: %s", uptime));
  }
};