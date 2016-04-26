"use strict";

const util = require('util');
const moment = require('moment');

require("moment-duration-format");

module.exports = {
  name: "uptime",
  aliases: ["up"],
  description: "Get bot uptime",
  usage: "uptime",
  hideFromHelp: true,
  callback: function (msg, command, args) {
    let uptime = moment.duration(process.uptime(), "seconds"),
        msgArray = [];
    this.bot.sendMessage(msg.channel, util.format("```Uptime: %s```", uptime.format("w [weeks] d [days], h [hrs], m [min], s [sec]")));
  }
};