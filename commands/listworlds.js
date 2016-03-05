"use strict"

var _ = require('underscore'),
    util = require('util'),
    models = require('../models');

module.exports = {
  name: "listworlds",
  description: "List worlds supported by the bot.",
  usage: "!listworlds",
  callback: function (msg, command, args) {
    var bot = this.bot,
        config = this.config,
        chatLog = this.chatLog;

    models.Servers.findAll({}).then(function (serverList) {
      serverList = serverList.map(function (o) { return o.toJSON(); });
      serverList = _.pluck(serverList, 'name');
      bot.sendMessage(msg.channel, util.format("Supported worlds: %s", serverList.join(', ')));
    });
  }
};