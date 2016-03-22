"use strict";

const _ = require('underscore');
const api = require('./api');
const util = require('util');
const cron = require('cron');
const async = require('async');
const logger = require('./logger');
const models = require('../models');
const moment = require('moment');
const Promise = require('bluebird');

let CronJob = cron.CronJob,
    timeFormat = 'HH:mm:ss';

class Monitor {

  start (config, bot) {
    this.bot = bot;
    this.config = config;
    this.job = new CronJob({
      cronTime: '0 10,20,30,40,50 * * * *',
      onTick: this.getMonitors,
      context: this,
      onComplete: () => {
        logger.info("[%s] Monitor finished.", moment().format(timeFormat));
      },
      start: true
    });

    logger.info("[%s] Starting monitor", moment().format(timeFormat));
  }

  getMonitors () {
    let constraint = (new Date() / 1000) - 1800; // -30m

    logger.info("[%s] Starting monitor check.", moment().format(timeFormat));

    models.Monitors.findAll({
      where: { last_check: { $lte: constraint } }
    })
    .then(monitors => {
      if (!monitors || !monitors.length) {
        return;
      }

      return this.queueMonitors(monitors);
    })
    .catch(err => {
      return logger.error(err);
    });
  }

  queueMonitors (monitors) {
    // create check queue to check for updates
    let checkQueue = async.queue(this.checkForUpdates.bind(this), 10);

    // create update queue to update channels
    this.updateQueue = async.queue(this.update.bind(this), 10);

    logger.info("Queuing %d monitors for update.", monitors.length);

    // push monitors to queue
    checkQueue.push(monitors, err => {
      if (err) {
        return logger.error(err);
      }
      return;
    });

    checkQueue.drain = function () {
      logger.info("Finished all checks.");
    };

    this.updateQueue.drain = function () {
      logger.info('Finished all updates.');
    };
  }

  checkForUpdates (monitor, callback) {
    let servers = _.indexBy(this.config.servers, 'name'),
        server = servers[monitor.world].server;

    Promise.join(
      api.get({ monitor, server, endpoint: 'updates' }),
      api.get({ monitor, server, endpoint: 'conquers' }),
      api.get({ monitor, server, endpoint: 'allianceChanges' }),
      (updates, conquers, changes) => {
        let hasChanges = updates || conquers || changes || null;
        if (!hasChanges) {
          return callback();
        }
        
        // push updates to queue
        this.updateQueue.push({
          monitor,
          updates,
          conquers,
          changes
        });

        return callback();
      }
    );
  }

  update (data, callback) {
    logger.info('Updating %s, %s, %s', data.monitor.server, data.monitor.channel, data.monitor.world);
    data.server = _.findWhere(this.bot.servers, { id: data.monitor.server });
    data.channel = _.findWhere(data.server.channels, { id: data.monitor.channel });

    async.series([
      this.sendUpdates.bind(this, data),
      this.sendConquers.bind(this, data),
      this.sendChanges.bind(this, data),
      this.updateMonitor.bind(this, data)
    ], (err, result) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }
      return callback();
    });
  }

  updateMonitor (data, callback) {
    data.monitor.updateAttributes({
      last_check: Math.round(new Date() / 1000)
    })
    .then(function () {
      return callback();
    });

  }

  sendUpdates (data, callback) {
    let updates = data.updates,
        msgArray = [],
        msgArrays = [],
        msgString = '',
        hasChanges = false;

    _.each(updates, o => {
      if (o.length) { hasChanges = true; }
    });

    if (!updates || _.isEmpty(updates) || !hasChanges) {
      return callback();
    }

    logger.info("Sending updates to %s", data.channel.id);

    msgArray.push('');
    msgArray.push("**ABP Alerts**");
    _.each(updates, (alliance, i) => {
      if (!alliance.length) { return; }

      msgArray.push(util.format("\t**%s (%s)**", _.sample(alliance).alliance_name, data.monitor.world));
      _.each(alliance, update => {
        if (update.abp_delta === 0) {
          return;
        }
        msgArray.push(util.format("\t\t%s: +%s", update.name, update.abp_delta));
      });
    });

    msgArray.push("**DBP Alerts**");
    _.each(updates, alliance => {
      if (!alliance.length) { return; }

      msgArray.push(util.format("\t**%s (%s)**", _.sample(alliance).alliance_name, data.monitor.world));
      _.each(alliance, update => {
        if (update.dbp_delta === 0) {
          return;
        }
        msgArray.push(util.format("\t\t%s: +%s", update.name, update.dbp_delta));
      });
    });

    msgString = msgArray.join("\n");

    if (msgString.length > 2000) {
      let str = '', pos;
      while (msgString.length > 0) {
        if (msgString.length > 2000) {
          pos = msgString.lastIndexOf("\n",2000);
        } else {
          pos = msgString.length;
        }
        str = msgString.substr(0, pos);
        msgString = msgString.substr(pos);
        msgArrays.push(str);
      }
    } else {
      msgArrays.push(msgString);
    }

    async.eachSeries(msgArrays, (msgArray, callback) => {
      this.bot.sendMessage(data.channel, msgArray, {}, (err, msg) => {
        if (err) {
          logger.error(err);
          return callback();
        }
        return callback();
      });
    }, () => {
      return callback();
    });
  }

  sendConquers (data, callback) {
    let conquers = data.conquers,
        msgArray = [],
        msgArrays = [],
        msgString = '',
        hasChanges = false;

    if (!conquers || _.isEmpty(conquers)) {
      return callback();
    }

    _.each(conquers, o => {
      if (o.length) { hasChanges = true; }
    });

    if (!conquers || _.isEmpty(conquers) || !hasChanges) {
      return callback();
    }

    logger.info("Sending conquers to %s", data.channel.id);

    msgArray.push('');
    msgArray.push("**Conquest Alerts**");
    _.each(conquers, (alliance, id) => {
      if (!alliance.length) { return; }

      msgArray.push(util.format("\n\t**%s (%s)**", _.sample(alliance).alliance_name, data.monitor.world));
      
      _.each(alliance, cq => {
        if (parseInt(cq.newally.id,10) === parseInt(id)) {
          msgArray.push(util.format("\t\t__%s__ conquered `%s` from __%s__ *(%s)*", cq.newplayer.name, cq.town.name, 
            cq.oldplayer.name, cq.oldally.name));
        }
        if (parseInt(cq.oldally.id,10) === parseInt(id)) {
          msgArray.push(util.format("\t\t__%s__ lost `%s` to __%s__ *(%s)*", cq.oldplayer.name, cq.town.name, 
            cq.newplayer.name, cq.newally.name));
        }
      });
    });

    msgString = msgArray.join("\n");

    if (msgString.length > 2000) {
      let str = '', pos;
      while (msgString.length > 0) {
        if (msgString.length > 2000) {
          pos = msgString.lastIndexOf("\n",2000);
        } else {
          pos = msgString.length;
        }
        str = msgString.substr(0, pos);
        msgString = msgString.substr(pos);
        msgArrays.push(str);
      }
    } else {
      msgArrays.push(msgString);
    }

    async.eachSeries(msgArrays, (msgArray, callback) => {
      this.bot.sendMessage(data.channel, msgArray, {}, function (err, msg) {
        if (err) {
          logger.error(err);
          return callback(err);
        }
        return callback(null);
      });
    }, () => {
      return callback();
    });
  }

  sendChanges (data, callback) {
    let changes = data.changes,
        msgArray = [],
        msgArrays = [],
        msgString = '',
        hasChanges = false;

    _.each(changes, o => {
      if (o.length) { hasChanges = true; }
    });

    if (!changes || _.isEmpty(changes) || !hasChanges) {
      return callback();
    }

    logger.info("Sending member changes to %s", data.channel.id);

    msgArray.push('');
    msgArray.push("**Alliance Member Changes**");
    _.each(changes, (alliance, id) => {
      if (!alliance.length) { return; }

      msgArray.push(util.format("\n\t**%s (%s)**", _.sample(alliance).alliance_name, data.monitor.world));

      _.each(alliance, o => {
        if (parseInt(o.new_alliance,10) === parseInt(id,10)) {
          msgArray.push(util.format("\t\tPlayer __%s__ joined __%s__", o.player_name, o.new_alliance_name));
        }
        if (parseInt(o.old_alliance,10) === parseInt(id,10)) {
          msgArray.push(util.format("\t\tPlayer __%s__ left __%s__", o.player_name, o.old_alliance_name));
        }
      });
    });

    msgString = msgArray.join("\n");

    if (msgString.length > 2000) {
      let str = '', pos;
      while (msgString.length > 0) {
        if (msgString.length > 2000) {
          pos = msgString.lastIndexOf("\n",2000);
        } else {
          pos = msgString.length;
        }
        str = msgString.substr(0, pos);
        msgString = msgString.substr(pos);
        msgArrays.push(str);
      }
    } else {
      msgArrays.push(msgString);
    }

    async.eachSeries(msgArrays, (msgArray, callback) => {
      this.bot.sendMessage(data.channel, msgArray, {}, function (err, msg) {
        if (err) {
          logger.error(err);
          return callback(err);
        }
        return callback(null);
      });
    }, () => {
      return callback();
    });
  }
}

module.exports = new Monitor();
