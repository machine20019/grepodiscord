"use strict"

var _ = require('underscore'),
    util = require('util'),
    async = require('async'),
    Promise = require('bluebird'),
    models = require('../models'),
    config;

module.exports = {
  name: "monitorlist",
  description: "Monitors an alliance.",
  usage: "!monitorlist",
  callback: function (msg, command, args) {
    var bot = this.bot,
        chatLog = this.chatLog,
        world;

    config = this.config;

    if (!msg.channel.server) {
      return bot.sendMessage(msg.author, "I can't do that in DM");
    }

    world = args.shift();

    models.Monitors
      .find({
        where: {
          server: msg.channel.server.id,
          channel: msg.channel.id
        }
      })
      .then(function (monitors) {
        if (!monitors) {
          return bot.sendMessage(msg.channel, "There are no monitors for this channel.");
        }

        var alliances = [];
        
        async.each(monitors, function (monitor, callback) {
          if (!monitor.alliances) {
            return callback();
          }

          getAlliances(monitor).then(function (result) {
            // alliances[monitor.world] = result;
            alliances.push(util.format("%s (%s)", result, monitor.world));
            return callback();
          });
        }, function (err) {
          alliances.unshift("Alliances monitored in this chat:");
          bot.sendMessage(msg.channel, alliances);
        });
      });
    }
};

function getAlliances (monitor) {

  return new Promise(function (resolve) {

    var world = _.findWhere(config.serverList, { name: monitor.world });

    models.Alliances
      .find({
        where: {
          server: world.server,
          id: { $in: monitor.alliances.split(',') }
        },
        attributes: ['name']
      })
      .then(function (alliances) {
        alliances = alliances.map(function (o) { return o.values(); });
        console.log(_.pluck(alliances, "name"));
        return resolve(_.pluck(alliances, "name"));
      });
  });
}