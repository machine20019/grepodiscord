"use strict";

const EventEmitter = require('events').EventEmitter;
const chokidar = require('chokidar');
const reload = require('require-reload')(require);
const logger = require('./logger');
const path = require('path');
const commandPath = path.join(process.env.PWD, 'commands');

class Watcher extends EventEmitter {
  constructor() {
    super();

    let watcher = chokidar.watch(commandPath, {
      ignored: /[\/\\]\./,
      persistent: true
    });

    watcher
      .on('add', this.addModule.bind(this))
      .on('change', this.reloadModule.bind(this))
      .on('unlink', this.unlinkModule.bind(this));

    this.watcher = watcher;
  }

  addModule(file) {
    let command = reload(file);
    
    logger.debug("File added: %s", file);

    if (command && command.name) {
      this.emit("reload", command);
    }
  }

  reloadModule(file) {
    let command = reload(file);
    
    logger.debug("File change: %s", file);

    if (command && command.name) {
      this.emit("reload", command);
    }
  }

  unlinkModule(file) {
    logger.debug("File deleted: %s", file);
    let name = path.basename(file);
    this.emit("unlink", name);
  }
}

module.exports = new Watcher();