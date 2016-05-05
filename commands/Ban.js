"use strict";

const Command = require('../lib/Command');

class Ban extends Command {
  
  constructor(config) {
    super(config);
    
    this.group = "Moderator";
    this.description = "Ban a member";
    this.usage = "ban <user mention>";
    this.example = "ban @NoobLance";
    this.permissions = "manageServer";
    this.disableDM = true;
  }
  
  static get name() {
    return "ban";
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
      msg.client.banMember(user, msg.channel.server, (err) => {
        if (err) {
          return this.log("Error", err);
        }
        
        msg.client.unbanMember(user, msg.channel.server);
        this.sendMessage(`_**${user} banned! :ok_hand:**_`);
      });
    }
  }
}

module.exports = Ban;