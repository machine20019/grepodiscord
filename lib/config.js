"use strict";

const path = require('path');
const getenv = require('getenv');
const pkg = require('../package.json');

require('dotenv').config({ silent: true });

var config = {
  version: pkg.version,
  dbPath: path.join(__dirname, '..', 'db'),
  imagePath: path.join(__dirname, '..', "public/images"),
  commandPath: path.join(__dirname, '..', "commands"),
  controllerPath: path.join(__dirname, '..', 'controllers'),
  botToken: getenv('BOT_TOKEN', ''),
  email: getenv('BOT_EMAIL', ''),
  password: getenv('BOT_PASSWORD', ''),
  botServerId: getenv('BOT_SERVER_ID', ''),
  logChannelId: getenv('LOG_CHANNEL_ID', ''),
  monitorEnabled: getenv.bool('MONITOR_ENABLED', true),
  port: getenv('PORT', 8000),
  views: path.join(__dirname, 'views'),
  public: path.join(__dirname, 'public'),
  models: path.join(__dirname, 'models'),
  poweredBy: 'GrepInformant http://www.grepinformant.com',
  botServer: null,
  logChannel: null,
  pollInterval: 600,
  serverList: {},
  adminServers: {}
};

module.exports = config;