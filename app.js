"use strict";

// load .env file if exists, must be loaded before other modules that require access to env
require('dotenv').config({ silent: true });

const path = require('path');
const getenv = require('getenv');
const Bot = require('./lib/bot');
const Server = require('./lib/server');

let config = {
  commandPath: path.join(__dirname, "commands"),
  defaultServer: getenv('BOT_SERVER'),
  email: getenv('BOT_EMAIL'),
  password: getenv('BOT_PASSWORD'),
  botServerId: getenv('BOT_SERVER_ID'),
  logChannelId: getenv('LOG_CHANNEL_ID'),
  botToken: getenv('BOT_TOKEN'),
  monitorEnabled: getenv.bool('MONITOR_ENABLED', false),
  port: getenv('PORT', 8000),
  views: path.join(__dirname, 'views'),
  public: path.join(__dirname, 'public'),
  models: path.join(__dirname, 'models'),
  controllers: path.join(__dirname, 'controllers'),
  poweredBy: 'GrepInformant http://www.grepinformant.com',
  botServer: null,
  logChannel: null,
  pollInterval: 600,
  serverList: {},
  adminServers: {}
};

// start bot
let bot = new Bot(config),
    app = new Server(config, bot);

bot.on('ready', () => {
  app.start();
});

