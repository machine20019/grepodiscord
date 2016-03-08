"use strict"

var _ = require('underscore'),
    util = require('util'),
    Promise = require('bluebird'),
    models = require('../models');

require('dotenv').load();

var config = {
  dbString: process.env.HEROKU_POSTGRESQL_CHARCOAL_URL,
  defaultServer: process.env.SERVER,
  email: process.env.BOT_EMAIL,
  password: process.env.BOT_PASSWORD,
  botServerId: process.env.BOT_SERVER_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,
  botServer: null,
  logChannel: null
};

var Monitor = {};

Monitor.init = function (callback) {
  var self = this;
  self.working = false;

  setInterval(function () {
    self.checkForUpdates()
        .then(self.updateBattlePoints)
        .then(self.updateConquers)
        .then(self.updateAllianceChanges)
        .then(function () {
          self.working = false;
        });
  }, 500);
};

Monitor.checkForUpdates = function () {
  var self = this;

  return new Promise(function (resolve, reject) {
    if (self.working) {
      return reject();
    }
    self.working = true;

    return resolve(true);
  });
};

Monitor.updateBattlePoints = function () {
  var self = this;

  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};

Monitor.updateConquers = function () {
  var self = this;

  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};

Monitor.updateAllianceChanges = function () {
  var self = this;

  return new Promise(function (resolve, reject) {
    return resolve(true);
  });
};
