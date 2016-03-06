"use strict"

var _ = require('underscore'),
    util = require('util'),
    async = require('async'),
    Promise = require('bluebird'),
    models = require('../models'),
    config;

module.exports = {
  name: "botservers",
  description: "Gets a list of servers the bot is in.",
  usage: "!botservers",
  permissions: "admin",
  callback: function (msg, command, args) {
    var bot = this.bot,
        chatLog = this.chatLog,
        servers = bot.servers,
        msgArray = [];

    servers = servers.map(function (o) { return { id: o.id, name: o.name }; });

    msgArray.push("Bot Servers:");

    _.each(servers, function (o) {
      msgArray.push(util.format("%s (%s)", o.name, o.id));
    });

    bot.sendMessage(msg.channel, msgArray);
  }
};