"use strict";

const config = require('./lib/config');
const program = require('commander');
const pkg = require('./package.json');

program
  .version(pkg.version)
  .option('-l, --log-level [loglevel]', 'Set log level (default: info)')
  .option('-m, --monitor [monitor]', 'Enable/disable monitor (default: true)')
  .option('-p, --prefixes [prefixes]', 'Comma delimited list of prefixes')
  .option('-s, --server [server]', 'Enable/disable http server (default: true)')
  .option('--self', "Start using email/password")
  .parse(process.argv);

if (program.monitor === 'false') {
  config.monitorEnabled = false;
}

config.logLevel = program.logLevel;
config.prefixes = program.prefixes;
config.self = program.self;

const Bot = require('./lib/Bot');
const Server = require('./lib/Server');

// start bot
let bot = new Bot(),
    server;

if (!program.self || (program.server && program.server !== false))
  server = new Server(bot);

if (process.versions.electron) {
  require('./app/main')(bot);
}

bot.on('ready', () => {
  if (server) server.start();
});