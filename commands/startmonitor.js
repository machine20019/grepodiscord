"use strict";

const util = require('util');

module.exports = {
  name: "startmonitor",
  description: "Start monitoring for updates",
  usage: "startmonitor",
  permissions: "admin",
  callback: function (msg, command, args) {
    if (this.monitor.started === true) {
      this.bot.sendMessage(msg.channel, "Monitor is already running.");
      return;
    }

    // create and start monitor
    this.monitor.start(this.config, this.bot);

    this.bot.sendMessage(msg.channel, "Started monitor");
  }
};