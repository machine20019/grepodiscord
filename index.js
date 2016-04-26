"use strict";

const config = require('./lib/config');
const program = require('commander');
const pkg = require('./package.json');

program
  .version(pkg.version)
  .option('-l, --log-level [loglevel]', 'Set log level (default: info)')
  .option('-m, --monitor [monitor]', 'Enable/disable monitor (default: true)')
  .parse(process.argv);

if (program.monitor === 'false') {
  config.monitorEnabled = false;
}

if (program.logLevel) {
  config.logLevel = program.logLevel;
}

const Bot = require('./lib/bot');
const Server = require('./lib/server');

// start bot
let bot = new Bot(),
    server = new Server(bot);

if (process.versions.electron) {
  require('./app/main')(bot);
}

bot.on('ready', () => {
  server.start();
});