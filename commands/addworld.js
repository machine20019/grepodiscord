"use strict";

const util = require('util');
const models = require('../models');
const Command = require('../lib/Command.js');

class AddWorld extends Command {
  
  constructor(bot, config) {
    super(bot, config);
    
    this.group = "Grepolis";
    this.description = 'Adds a world to be monitored.';
    this.usage = 'addworld <world name> <world id>';
    this.example = 'addworld baris us46';
    this.permissions = 'admin';
  }
  
  /**
   * Command name to be registered
   */
  static get name() {
    return 'addworld';
  }
  
  /**
   * @param {Object} msg
   * @param {String} command
   * @param {Array} args
   */
  execute(msg, args) {
    super.execute.apply(this, arguments);
    
    if (!this.validate(args, 2)) return;
    
    // create new server model
    models.Servers
    .build({
      server: args[1],
      name: args[0]
    })
    .save()
    .then(() => {
      models.Servers.findAll({}).then(serverList => {
        // update server list
        this.config.serverList = serverList;
        
        this.sendMessage(util.format("Added world %s (%s)", args[0], args[1]));
        this.log("Command", `World added: ${args[0]} (${args[1]})`);
      });
    });
    
  }
}

module.exports = AddWorld;
// module.exports = {
//   name: "addworld",
//   description: "Adds a world to be monitored.",
//   usage: "addworld <world name> <world id>",
//   example: "addworld baris us46",
//   permissions: "admin",
//   callback: function (msg, command, args) {
//   }
// };