"use strict";

const fs = require('fs');
const http = require('http');
const path = require('path');
const express = require('express');
const exphbs  = require('express-handlebars');
const logger = require('./lib/logger');
const Bot = require('./lib/bot');
// const Discord = require('node-discord');

// load .env file if exists
if (fs.existsSync(path.join(process.env.PWD, '.env'))) {
  require('dotenv').load();
}

let config = {
  commandPath: path.join(__dirname, "commands"),
  defaultServer: process.env.SERVER,
  email: process.env.BOT_EMAIL,
  password: process.env.BOT_PASSWORD,
  botServerId: process.env.BOT_SERVER_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,
  botToken: process.env.BOT_TOKEN,
  botServer: null,
  logChannel: null,
  pollInterval: 600,
  serverList: {},
  adminServers: {}
};

// start bot
let bot = new Bot(config),
    app = express();

/**
 * Start Web Server setup
 */
app.set('port', process.env.PORT || 8000);
app.set('views', path.join(__dirname, 'views'));

app.engine('hbs', exphbs({
  extname: '.hbs',
  defaultLayout: 'main',
  partialsDir: 'views/partials/'
}));

app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Grepolis Tools https://github.com/briantanner/Grepolis-Tools');
  next();
});

app.get('/', (req, res) => {
  res.status(200).send('This is the Grepolis Discord Bot. Nothing to show here.');
});

// create server
http.createServer(app).listen(app.get('port'), () => {
  logger.info('Express server listening on port %d', app.get('port'));
});
