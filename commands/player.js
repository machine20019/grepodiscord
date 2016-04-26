"use strict";

const _ = require('underscore');
const util = require('util');
const api = require('../lib/api');
const format = require('string-format');
const urlencode = require('urlencode');
const logger = require('../lib/logger');

module.exports = {
  name: "player",
  description: "Get player information",
  usage: "player <world name> <player name>",
  callback: function (msg, command, args) {
    let uri = "",
        player = '',
        msgArray = [],
        server;

    if (!args.length || args.length < 2) {
      let msgArray = [];
      msgArray.push("```\n");
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      msgArray.push(util.format("Example: %s", module.exports.exampls));
      msgArray.push("```");
      return this.bot.sendMessage(msg.channel, msgArray);
    }

    server = _.findWhere(this.config.servers, { name: args.shift() }).server;
    player = urlencode.encode(args.slice(0).join(' ').replace(/\s/g, '+'));
    uri = util.format("/api/v1/%s/player/%s", server, player);

    let pad = function (str, n) {
      return (str + " ".repeat(n)).slice(0, n);
    };

    api.request(uri).then(player => {
      player.alliance = player.Alliance.name;

      msgArray.push("```");

      msgArray.push(pad("Name:", 10) + player.name);
      msgArray.push(pad("Alliance:", 10) + player.alliance);
      msgArray.push(pad("Rank:", 10) + player.rank);
      msgArray.push(pad("Towns:", 10) + player.towns);
      msgArray.push(pad("Points:", 10) + player.points);
      msgArray.push(pad("ABP:", 10) + player.abp);
      msgArray.push(pad("DBP:", 10) + player.dbp);
      
      msgArray.push("\nUpdates:\n");
      
      msgArray.push(pad("Time", 7) + pad("Towns", 6) + pad("Points", 8) + pad("ABP", 8) + "DBP");

      player.Updates.forEach(o => {
        msgArray.push(pad(o.time, 7) + pad(o.towns_delta, 6) + pad(o.points_delta, 8) + pad(o.abp_delta, 8) + o.dbp_delta);
      });

      msgArray.push("```");

      this.bot.sendMessage(msg.channel, msgArray);
    })
    .catch(err => {
      logger.error(err);
    });
  }
};