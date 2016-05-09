"use strict";

const _ = require('underscore');
const util = require('util');
const models = require('../../models');
const Command = require('../../lib/Command');

class Monitor extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["monitor"];
    this.group = "Grepolis";
    this.description = "Monitor an alliance.";
    this.usage = "monitor <world name> <alliance name>";
    this.example = "monitor farsala My Alliance";
    this.disableDM = true;
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    
    if (!this.validate(args, 2)) return;
    
    let world = args.shift();
    
    this.channel = msg.channel;
    this.world = _.findWhere(this.config.servers, { name: world });
    this.alliance = args.join(' ');

    models.Monitors
    .find({
      where: {
        server: msg.channel.server.id,
        channel: msg.channel.id,
        world: world
      }
    })
    .then(monitor => {
      let handler;

      if (monitor) {
        this.monitor = monitor;
        handler = this.updateMonitor.bind(this);
      } else {
        handler = this.addMonitor.bind(this);
      }

      this.getAllianceId()
        .then(handler)
        .then(() => {
          let reply = '';

          if (this.added) {
            reply = util.format("Enabled monitor for %s (%s)", this.alliance, this.world.name);
          } else if (this.removed) {
            reply = util.format("Disabled monitor for %s (%s)", this.alliance, this.world.name);
          }

          this.sendMessage(reply);
        });
    });
  }
  
  getAllianceId() {
    return new Promise((resolve) => {
      models.Alliances
        .find({
          where: {
            server: this.world.server,
            name: {
              $ilike: this.alliance.replace(/'/g, "''")
            }
          },
          attributes: ['id']
        })
        .then((alliance) => {
          this.allianceId = alliance.id;
          return resolve();
        });
    });
  }
  
  addMonitor() {
    return new Promise((resolve) => {
      models.Monitors
        .build({
          server: this.channel.server.id,
          channel: this.channel.id,
          world: this.world.name,
          alliances: this.allianceId,
          last_check: 0
        })
        .save()
        .then(() => {
          return resolve();
        });
    });
  }
  
  updateMonitor() {
    return new Promise((resolve) => {
      let alliances = _.map(this.monitor.alliances.split(','), function (n) { return parseInt(n,10); });

      if (alliances.indexOf(this.allianceId) !== -1) {
        alliances = _.without(alliances, this.allianceId);
        this.removed = true;
      } else {
        alliances.push(this.allianceId);
        this.added = true;
      }

      this.monitor.updateAttributes({
        alliances: alliances.join(',')
      })
      .then(function () {
        return resolve();
      });
    });
  }
}

module.exports = Monitor;