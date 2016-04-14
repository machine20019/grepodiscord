"use strict";

const util = require('util');

module.exports = {
  name: "stopmonitor",
  description: "Stop monitoring for updates",
  usage: "!stopmonitor",
  permissions: "admin",
  callback: function (msg, command, args) {
    if (this.monitor.started !== true) {
      this.bot.sendMessage(msg.channel, "Monitor is already stopped.");
      return;
    }

    // stop the monitor
    this.monitor.stop();

    this.bot.sendMessage(msg.channel, "Stopped monitoring for updates");
  }
};