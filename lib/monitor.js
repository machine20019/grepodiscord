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

  /**
   * Start monitor
   * @param  {Object} config Monitor configuration
   * @param  {Object} bot    discord.js client reference
   */
  start (config, bot) {
    this.bot = bot;
    this.config = config;
    this.job = new CronJob({
      cronTime: '0 10,15,20,25,30,35,40,45,50,55 * * * *',
      onTick: this.getMonitors,
      context: this,
      onComplete: () => {
        logger.info("[%s] Monitor finished.", moment().format(timeFormat));
      },
      start: true
    });

    logger.info("[%s] Starting monitor", moment().format(timeFormat));
  }

  /**
   * Get monitors from db for updating
   */
  getMonitors () {
    let constraint = (new Date() / 1000) - 1800; // -30m

    logger.info("[%s] Starting monitor check.", moment().format(timeFormat));

    models.Monitors.findAll({
      where: {
        alliances: { $ne: '' },
        last_check: { $lte: constraint }
      }
    })
    .then(monitors => {
      if (!monitors || !monitors.length) {
        return;
      }

      this.queueMonitors(monitors);
    })
    .catch(err => {
      logger.error(err);
    });
  }

  /**
   * Queue monitors to check for updates
   * @param  {Array} monitors Array of monitors to check
   */
  queueMonitors (monitors) {
    // create check queue to check for updates
    let checkQueue = async.queue(this.checkForUpdates.bind(this), 10);

    // create update queue to update channels
    this.updateQueue = async.queue(this.update.bind(this), 10);

    logger.info("Queuing %d monitors for update.", monitors.length);

    // push monitors to queue
    checkQueue.push(monitors, err => {
      if (err) {
        logger.error(err);
      }
    });

    // Check for updates done
    checkQueue.drain = function () {
      logger.info("Finished all checks.");
    };

    // Update monitors done
    this.updateQueue.drain = function () {
      logger.info('Finished all updates.');
    };
  }

  /**
   * Check for updates
   * @param  {Object}   monitor  Monitor object
   * @param  {Function} callback
   */
  checkForUpdates (monitor, callback) {
    let servers = _.indexBy(this.config.servers, 'name'),
        server = servers[monitor.world].server;

    if (!monitor.alliances.length) {
      return callback();
    }

    // Query api for updates
    Promise.join(
      api.getMonitor({ monitor, server, endpoint: 'updates' }),
      api.getMonitor({ monitor, server, endpoint: 'conquers' }),
      api.getMonitor({ monitor, server, endpoint: 'allianceChanges' }),
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

  /**
   * Send updates to channel
   * @param  {Object}   data     Data containing updates
   * @param  {Function} callback
   */
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

  /**
   * Update monitor check time
   * @param  {Object}   data     Monitor object
   * @param  {Function} callback
   */
  updateMonitor (data, callback) {
    data.monitor.updateAttributes({
      last_check: Math.round(new Date() / 1000)
    })
    .then(function () {
      return callback();
    });

  }

  /**
   * Utility function to partition array by string length
   * @param  {Array} arr  Array to partition
   * @param  {Number} len String length of partition
   * @return {Array}      Partitioned array
   */
  partitionArray(arr, len) {
    let arrayStr = arr.join("\n"),
        strArray = [];
        str = '',
        pos;

    if (arrayStr.length > len) {
      while (arrayStr.length > 0) {
        if (arrayStr.length > len) {
          pos = arrayStr.lastIndexOf("\n", len);
        } else {
          pos = arrayStr.length;
        }
        str = arrayStr.substr(0, pos);
        arrayStr = arrayStr.substr(pos);
        strArray.push(str);
      }
    } else {
      strArray.push(arrayStr);
    }

    return strArray;
  }

  /**
   * Utility function to send to channel
   * @param  {Object}   channel  Channel resolvable
   * @param  {Array}    msgArray Messages array
   * @param  {Function} callback Callback
   */
  sendToChannel(channel, msgArray, callback) {
    // Split string by 2000 characters (discord message limit)
    msgArray = this.partitionArray(msgArray, 2000);

    // Send updates to channel
    async.eachSeries(msgArray, (msg, callback) => {
      this.bot.sendMessage(channel, msg, {}, callback);
    }, err => {
      if (err) {
        logger.error(err);
      }
      return callback();
    });
  }

  /**
   * Send battle points to channel
   * @param  {Object}   data     Update data
   * @param  {Function} callback
   */
  sendUpdates (data, callback) {
    let updates = data.updates,
        msgArray = [],
        abpArray = [],
        dbpArray = [],
        hasChanges = false;

    _.each(updates, o => {
      if (o.length) {
        hasChanges = true;
      }
    });

    if (!updates || _.isEmpty(updates) || !hasChanges) {
      return callback();
    }

    logger.info("Sending updates to %s", data.channel.id);

    _.each(updates, (alliance, i) => {
      if (!alliance.length) {
        return;
      }

      // Add ABP alerts
      if (alliance.hasAbp) {
        abpArray.push(util.format("\t**%s (%s)**", _.sample(alliance).alliance_name, data.monitor.world));
        
        _.each(alliance, update => {
          abpArray.push(util.format("\t\t%s: +%s", update.name, update.abp_delta));
        });
      }

      // Add DBP alerts
      if (alliance.hasDbp) {
        dbpArray.push(util.format("\t**%s (%s)**", _.sample(alliance).alliance_name, data.monitor.world));
        _.each(alliance, update => {
          dbpArray.push(util.format("\t\t%s: +%s", update.name, update.dbp_delta));
        });
      }
    });

    if (abpArray.length) {
      msgArray.push("**ABP Alerts**");
      msgArray = msgArray.concat(abpArray);
    }

    if (dbpArray.length) {
      msgArray.push("**DBP Alerts**");
      magArray = msgArray.concat(dbpArray);
    }

    // Split string by 2000 characters (discord message limit)
    msgArray = this.partitionArray(msgArray, 2000);

    // Send updates to channel
    this.sendToChannel(data.channel, msgArray, callback);
  }

  /**
   * Send conquers to channel
   * @param  {Object}   data     Conquer data
   * @param  {Function} callback
   */
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

    // Build conquer alerts
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

    // Split string by 2000 characters (discord message limit)
    msgArray = this.partitionArray(msgArray, 2000);

    // Send updates to channel
    this.sendToChannel(data.channel, msgArray, callback);
  }

  /**
   * Send alliance member changes to channel
   * @param  {Object}   data     Member changes data
   * @param  {Function} callback
   */
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

    // Build alliance member changes
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

    // Split string by 2000 characters (discord message limit)
    msgArray = this.partitionArray(msgArray, 2000);

    // Send updates to channel
    this.sendToChannel(data.channel, msgArray, callback);
  }
}

module.exports = new Monitor();
