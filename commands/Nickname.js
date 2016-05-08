"use strict";

const util = require('util');
const Command = require('../lib/Command');

class Nickname extends Command {
  
  constructor(config) {
    super(config);
    
    this.group = "Admin";
    this.description = "Changes the bot nickname.";
    this.usage = "nickname <new nickname>";
    this.permissions = "admin";
    this.disableDM = true;
  }
  
  static get name() {
    return "nickname";
  }
  
  static get aliases() {
    return ["nick"];
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 1)) return;
    
    if (args[0] === 'unset') {
      args[0] = '';
    }
    
    msg.client.setNickname(msg.channel.server, args.join(' '), msg.client.user, err => {
      if (err) {
        console.log(err);
        return this.log("Error", `Failed to set nickname to: ${args.join(' ')} on ${msg.channel.server} requested by ${msg.author}`);
      }
      
      this.sendMessage(`Nickname changed to ${args.join(' ')}`);
      this.log("Info", `Set nickname to ${args.join(' ')} on ${msg.channel.server} requested by ${msg.author}`);
    });
  }
}

module.exports = Nickname;