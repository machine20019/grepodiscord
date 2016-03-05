"use strict"

var util = require('util'),
    moment = require('moment');

require("moment-duration-format");

module.exports = {
  name: "uptime",
  description: "Get bot uptime",
  usage: "!uptime",
  callback: function (msg, command, args) {
    var uptime = moment.duration(Math.round(process.uptime()), "seconds").format();
    this.bot.sendMessage(msg.channel, util.format("Uptime: %s", uptime));
  }
};