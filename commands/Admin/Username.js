"use strict";

const util = require('util');
const Command = require('../../lib/Command');

class Username extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["username", "un"];
    this.group = "Admin";
    this.description = "Change the bot username.";
    this.usage = "username <current username> <new username>";
    this.permissions = "admin";
    this.disableDM = true;
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 2)) return;
    
    if (args.shift() !== msg.client.user.username) return;
    
    msg.client.setUsername(args.join(' '), err => {
      if (err)
        return this.log("Error", `Failed to set username to: ${args.join(' ')} requested by ${msg.author}`);
      
      this.sendMessage(`Username changed to ${args.join(' ')}`);
      this.log("Info", `Set username: ${args.join(' ')} requested by ${msg.author}`);
    });
  }
}

module.exports = Username;