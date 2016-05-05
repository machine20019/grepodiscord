"use strict";

const Command = require('../lib/Command');

class Kick extends Command {
  
  constructor(config) {
    super(config);
    
    this.group = "Moderator";
    this.description = "Kick a member";
    this.usage = "kick <user mention>";
    this.example = "kick @NoobLance";
    this.permissions = "manageServer";
    this.disableDM = true;
  }
  
  static get name() {
    return "kick";
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 1)) return;
    
    if (msg.mentions.length === 0) {
      return this.sendMessage("Please mention the user.");
    }
    
    for (let i in msg.mentions) {
      let user = msg.mentions[i];
      if (user === msg.client.user || user === msg.author) return;
      msg.client.kickMember(user, msg.channel.server, (err) => {
        if (err) {
          return this.log("Error", err);
        }
        
        this.sendMessage(`:ok_hand:`);
      });
    }
  }
}

module.exports = Kick;