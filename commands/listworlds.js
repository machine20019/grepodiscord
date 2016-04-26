"use strict";

const _ = require('underscore');
const util = require('util');
const models = require('../models');

module.exports = {
  name: "listworlds",
  description: "List worlds supported by the bot.",
  usage: "listworlds",
  callback: function (msg, command, args) {
    var bot = this.bot,
        config = this.config,
        chatLog = this.chatLog;

    models.Servers.findAll({}).then(serverList => {
      serverList = serverList.map(o => { return o.toJSON(); });
      serverList = _.pluck(serverList, 'name');
      bot.sendMessage(msg.channel, util.format("Supported worlds: %s", serverList.join(', ')));
    });
  }
};