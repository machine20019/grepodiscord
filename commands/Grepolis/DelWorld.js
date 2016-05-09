"use strict";

const util = require('util');
const Command = require('../../lib/Command');

class DelWorld extends Command {
  
  constructor(bot, config) {
    super(bot, config);
    
    this.aliases = ["delworld"];
    this.group = "Grepolis";
    this.description = "Delete a supported world.";
    this.usage = "delworld <world id>";
    this.example = "delworld us46";
    this.permissions = "admin";
  }
  
  /**
   * @param {Object} msg
   * @param {String} command
   * @param {Array} args
   */
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 1)) return;
    
    let db = msg.client.db;
    
    db.worlds.remove({ server: args[0] }, (err) => {
      db.worlds.find({}, (err, docs) => {
        this.config.worlds = docs;
        
        this.sendMessage(`Added removed ${args[0]}`);
        this.log("Command", `World removed: ${args[0]}`);
      });
    });
  }
}

module.exports = DelWorld;