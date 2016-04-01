"use strict";

const _ = require('underscore');
const util = require('util');
const async = require('async');
const models = require('../models');
const logger = require('../lib/logger');

let config;

module.exports = {
  name: "monitorlist",
  description: "Monitors an alliance.",
  usage: "!monitorlist",
  callback: function (msg, command, args) {
    let bot = this.bot,
        chatLog = this.chatLog,
        world;

    config = this.config;

    if (!msg.channel.server) {
      return bot.sendMessage(msg.author, "I can't do that in DM");
    }

    world = args.shift();

    models.Monitors.findAll({
      where: {
        server: msg.channel.server.id,
        channel: msg.channel.id
      }
    })
    .then(monitors => {
      if (!monitors) {
        return bot.sendMessage(msg.channel, "There are no monitors for this channel.");
      }

      monitors = _.map(monitors, o => { return o.toJSON(); });

      let alliances = [];
      
      async.each(monitors, (monitor, callback) => {
        if (!monitor.alliances) {
          return callback();
        }

        getAlliances(monitor)
        .then(result => {
          _.each(result, alliance => {
            alliances.push(util.format("\t%s (%s)", alliance, monitor.world));
          });
          return callback();
        })
        .catch(err => {
          return callback(err);
        });

      }, err => {
        if (err) { logger.error(err); }
        alliances.unshift("```Alliances monitored in this chat:");
        alliances.push("```");
        bot.sendMessage(msg.channel, alliances);
      });
    });
  }
};

function getAlliances (monitor) {

  return new Promise((resolve, reject) => {

    let world = _.findWhere(config.servers, { name: monitor.world });

    models.Alliances
    .findAll({
      where: {
        server: world.server,
        id: { $in: monitor.alliances.split(',') }
      },
      attributes: ['name']
    })
    .then(alliances => {
      alliances = alliances.map(o => { return o.toJSON(); });
      console.log(_.pluck(alliances, "name"));
      return resolve(_.pluck(alliances, "name"));
    });
  });
}