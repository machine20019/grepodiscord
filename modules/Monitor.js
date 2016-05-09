"use strict";

const _ = require('underscore');
const util = require('util');
const cron = require('cron');
const async = require('async');
const getenv = require('getenv');
const moment = require('moment');
const join = require('bluebird').join;
const logger = require('../lib/logger');
const models = require('../models');
const Api = require('../lib/Api');
const api = new Api();

_.throttle = require('lodash/throttle');

let CronJob = cron.CronJob,
    timeFormat = 'HH:mm:ss';

class Monitor {
  
  constructor(config) {
    this.config = config;
  }
  
  static get name() {
    return 'Grepolis Monitor';
  }

  /**
   * Start monitor
   * @param  {Object} config Monitor configuration
   * @param  {Object} bot    discord.js client reference
   */
  start(bot) {
    this.bot = bot;
    this.crontab = getenv('BOT_CRON', '0 10,15,20,25,30,35,40,45,50,55 * * * *');
    this.started = false;
    this.db = bot.db;

    bot.on('ready', () => {
      this.createMonitor();
    });
  }

  get isRunning() {
    return this.started;
  }

  createMonitor() {
    logger.info("Starting monitor");

    this.started = true;

    this.job = new CronJob({
      cronTime: this.crontab,
      onTick: _.throttle(this.getMonitors, 3000),
      context: this,
      start: true
    });
  }

  /**
   * Stop monitor
   */
  stop() {
    logger.info("Stopping monitor");
    this.job.stop();
    this.started = false;
  }

  /**
   * Restart monitor
   */
  restart() {
    logger.info("Restarting monitor");
    this.job.stop();
    this.job.start();
    this.started = true;
  }

  setPoll(crontab) {
    this.crontab = crontab;
    this.stop();
    this.createMonitor();
    this.started = true;
  }

  /**
   * Get monitors from db for updating
   */
  getMonitors() {
    let constraint = (new Date() / 1000) - 1800; // -30m
    
    this.db.monitors.find({
      alliances: { $ne: '' },
      last_check: { $lte: constraint }
    }, (err, monitors) => {
      if (err) return logger.error(err);
      if (!monitors || !monitors.length) return;
      
      this.queueMonitors(monitors);
    });
  }

  /**
   * Queue monitors to check for updates
   * @param  {Array} monitors Array of monitors to check
   */
  queueMonitors(monitors) {
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
  checkForUpdates(monitor, callback) {
    let servers = _.indexBy(this.config.worlds, 'name'),
        server = servers[monitor.world].server;

    if (!monitor.alliances.length) {
      return callback();
    }

    // Query api for updates
    join(
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
    ).catch(err => {
      logger.error(err);
      return callback();
    });
  }

  /**
   * Send updates to channel
   * @param  {Object}   data     Data containing updates
   * @param  {Function} callback
   */
  update(data, callback) {
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
  updateMonitor(data, callback) {
    data.monitor.updateAttributes({
      last_check: Math.round(new Date() / 1000)
    })
    .then(function () {
      return callback();
    })
    .catch(err => {
      logger.error(err);
      return callback();
    });
  }

  /**
   * Utility function to partition array by string length
   * @param  {Array} arr  Array to partition
   * @param  {Number} len String length of partition
   * @return {Array}      Partitioned array
   */
  partitionArray(msgArray) {
    // Convert to string
    let msgArrays = [],
        msgString = msgArray.join("\n");

    // Split string by 2000 characters (discord message limit)
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

    return msgArrays;
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
  sendUpdates(data, callback) {
    let updates = data.updates,
        msgArray = [],
        abpArray = [],
        dbpArray = [],
        hasChanges = false,
        hasAbp, hasDbp;

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

      hasAbp = _.filter(alliance, o => { return o.abp_delta !== 0; }).length !== 0 ? true : false;
      hasDbp = _.filter(alliance, o => { return o.dbp_delta !== 0; }).length !== 0 ? true : false;

      logger.debug(_.sample(alliance).alliance_name + " hasAbp: " + hasAbp);

      // Add ABP alerts
      if (hasAbp) {
        abpArray.push(util.format("\t**%s (%s)**", _.sample(alliance).alliance_name, data.monitor.world));
        
        _.each(alliance, update => {
          if (update.abp_delta === 0) { return; }
          abpArray.push(util.format("\t\t%s: +%s", update.name, update.abp_delta));
        });
      }

      logger.debug(_.sample(alliance).alliance_name + " hasDbp: " + hasDbp);

      // Add DBP alerts
      if (hasDbp) {
        dbpArray.push(util.format("\t**%s (%s)**", _.sample(alliance).alliance_name, data.monitor.world));

        _.each(alliance, update => {
          if (update.dbp_delta === 0) { return; }
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
      msgArray = msgArray.concat(dbpArray);
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
  sendConquers(data, callback) {
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

      let cqtowns = [];

      msgArray.push(util.format("\n\t**%s (%s)**", _.sample(alliance).alliance_name, data.monitor.world));
      
      _.each(alliance, cq => {
        // only show an internal once as conquered
        if (cq.newally === cq.oldally && cqtowns.indexOf(cq.town.id) !== -1) {
          return;
        }

        cqtowns.push(cq.town.id);

        // alliance conquered town
        if (cq.newally === parseInt(id,10)) {
          msgArray.push(util.format("\t\t__%s__ conquered `%s` from __%s__ *(%s)*", cq.newplayer_name, cq.town.name, 
            cq.oldplayer_name, cq.oldally_name));
          return;
        }

        // alliance lost town
        if (cq.oldally === parseInt(id,10)) {
          msgArray.push(util.format("\t\t__%s__ lost `%s` to __%s__ *(%s)*", cq.oldplayer_name, cq.town.name, 
            cq.newplayer_name, cq.newally_name));
          return;
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
  sendChanges(data, callback) {
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

module.exports = Monitor;
