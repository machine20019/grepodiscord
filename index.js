"use strict";

const config = require('./lib/config');
const program = require('commander');
const pkg = require('./package.json');

program
  .version(pkg.version)
  .option('-d, --debug', 'Run in debug mode')
  .option('-l, --log-level [loglevel]', 'Set log level (default: info)')
  .option('-m, --monitor [monitor]', 'Enable/disable monitor (default: true)')
  .option('-p, --prefixes [prefixes]', 'Comma delimited list of prefixes')
  .option('-s, --server [server]', 'Enable/disable http server (default: true)')
  .option('--self', "Start using email/password")
  .parse(process.argv);

if (program.monitor === 'false') {
  config.monitorEnabled = false;
}

config.debug = program.debug;
config.logLevel = program.logLevel;
config.prefixes = program.prefixes;
config.server = program.server;
config.self = program.self;

const Bot = require('./lib/Bot');
const bot = new Bot();

// const Server = require('./lib/Server');

// start bot

// if (!program.self || (program.server && program.server !== false))
//   server = new Server(bot);

// bot.on('ready', () => {
//   if (server) server.start();
// });