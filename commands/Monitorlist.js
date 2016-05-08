"use strict";

const _ = require('underscore');
const util = require('util');
const async = require('async');
const models = require('../models');
const logger = require('../lib/logger');
const Command = require('../lib/Command.js');

class MonitorList extends Command {
  
  constructor(config) {
    super(config);
    
    this.group = "Grepolis";
    this.description = "List alliance monitors.";
    this.usage = "monitorlist";
    this.disableDM = true;
  }
  
  static get name() {
    return "monitorlist";
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);

    if (!this.validate()) return;
    
    let world = args.shift();
    
    models.Monitors.findAll({
      where: {
        server: msg.channel.server.id,
        channel: msg.channel.id
      }
    })
    .then(monitors => {
      let alliances = [];
      
      if (!monitors) return this.sendMessage("There are no monitors for this channel.");

      monitors = _.map(monitors, o => { return o.toJSON(); });
      
      async.each(monitors, (monitor, callback) => {
        if (!monitor.alliances) return callback();

        this.getAlliances(monitor)
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
        if (err) logger.error(err);
        
        alliances.unshift("```Alliances monitored in this chat:");
        alliances.push("```");
        
        this.sendMessage(alliances);
      });
    });
  }
  
  getAlliances(monitor) {
    return new Promise((resolve, reject) => {

      let world = _.findWhere(this.config.servers, { name: monitor.world });

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
        return resolve(_.pluck(alliances, "name"));
      });
    });
  }
}

module.exports = MonitorList;