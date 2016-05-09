"use strict";

const _ = require('underscore');
const util = require('util');
const Command = require('../../lib/Command');

class ListWorlds extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["listworlds"];
    this.group = "Grepolis";
    this.description = "List worlds supported by the bot.";
    this.usage = "listworlds";
    this.disableDM = true;
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate()) return;
    
    this.sendMessage(util.format("Supported Worlds: %s", _.pluck(this.config.worlds, 'name').join(', ')));
  }
}

module.exports = ListWorlds;