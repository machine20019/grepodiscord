"use strict";

const _ = require('underscore');
const util = require('util');
const Api = require('../lib/Api');
const urlencode = require('urlencode');
const logger = require('../lib/logger');
const Command = require('../lib/Command');

let api = new Api();

class Player extends Command {
  
  constructor(config) {
    super(config);
    
    this.group = "Grepolis";
    this.description = "Get player stats";
    this.usage = "player <world name> <player name>";
  }
  
  static get name() {
    return "player";
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 2)) return;
    
    let server = _.findWhere(this.config.servers, { name: args.shift() }).server,
        player = urlencode.encode(args.slice(0).join(' ').replace(/\s/g, '+')),
        uri = `/api/v1/${server}/player/${player}`,
        msgArray = [];
    
    api.request(uri).then(player => {
      player.alliance = player.Alliance.name;
      
      msgArray.push("```");

      msgArray.push(this.pad("Name:", 10) + player.name);
      msgArray.push(this.pad("Alliance:", 10) + player.alliance);
      msgArray.push(this.pad("Rank:", 10) + player.rank);
      msgArray.push(this.pad("Towns:", 10) + player.towns);
      msgArray.push(this.pad("Points:", 10) + player.points);
      msgArray.push(this.pad("ABP:", 10) + player.abp);
      msgArray.push(this.pad("DBP:", 10) + player.dbp);
      
      msgArray.push("\nUpdates:\n");
      
      msgArray.push(this.pad("Time", 7) + this.pad("Towns", 6) + this.pad("Points", 8) + this.pad("ABP", 8) + "DBP");

      player.Updates.forEach(o => {
        msgArray.push(this.pad(o.time, 7) + this.pad(o.towns_delta, 6) + this.pad(o.points_delta, 8) + this.pad(o.abp_delta, 8) + o.dbp_delta);
      });

      msgArray.push("```");
      
      this.sendMessage(msgArray);
      
    }).catch(err => {
      logger.error(err);
      this.log("Error", err);
    });
  }
  
  pad(str, n) {
    return (str + " ".repeat(n)).slice(0, n);
  }
}

module.exports = Player;