"use strict";

const util = require('util');

module.exports = {
  name: "setpoll",
  description: "Sets the monitor poll interval by taking crontab minutes as argument",
  usage: "setpoll <minutes>",
  permissions: "admin",
  callback: function (msg, command, args) {
    let crontab = '0 %s * * * *',
        interval;

    if (!args.length) {
      let msgArray = [];
      msgArray.push("```\n");
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      msgArray.push("```");
      return this.bot.sendMessage(msg.channel, msgArray);
    }

    interval = args[0];

    if (interval.indexOf(" ") !== -1) {
      this.bot.sendMessage(msg.channel, "Invalid interval.");
      return;
    }

    crontab = util.format(crontab, interval);

    this.monitor.setPoll(crontab);
    this.bot.sendMessage(msg.channel, util.format("Updated poll interval to %s and restarting monitor", crontab));
  }
};