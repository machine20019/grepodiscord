"use strict";

const path = require('path');

let bot = require('./lib/bot');

require('dotenv').load();

let config = {
  commandPath: path.join(__dirname, "commands"),
  defaultServer: process.env.SERVER,
  email: process.env.BOT_EMAIL,
  password: process.env.BOT_PASSWORD,
  botServerId: process.env.BOT_SERVER_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,
  botServer: null,
  logChannel: null,
  pollInterval: 600,
  serverList: {},
  adminServers: {}
};

// start bot
bot(config);