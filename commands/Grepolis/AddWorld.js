"use strict";

const util = require('util');
const Command = require('../../lib/Command');

class AddWorld extends Command {
  
  constructor(bot, config) {
    super(bot, config);
    
    this.aliases = ["addworld"];
    this.group = "Grepolis";
    this.description = "Add a supported world.";
    this.usage = "addworld <world name> <world id>";
    this.example = "addworld baris us46";
    this.permissions = "admin";
  }
  
  /**
   * @param {Object} msg
   * @param {String} command
   * @param {Array} args
   */
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 2)) return;
    
    let db = msg.client.db;
    
    db.worlds.update({ server: args[1] }, {
      server: args[1],
      name: args[0]
    }, { upsert: true }, (err) => {
      db.worlds.find({}, (err, docs) => {
        this.config.worlds = docs;
        
        this.sendMessage(`Added world ${args[0]} (${args[1]})`);
        this.log("Command", `World added: ${args[0]} (${args[1]})`);
      });
    });
  }
}

module.exports = AddWorld;