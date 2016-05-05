"use strict";

const Command = require('../lib/Command.js');

class Del extends Command {
  
  constructor(config) {
    super(config);
    
    this.group = "Admin";
    this.description = "Delete own messages";
    this.usage = "del";
    this.hideFromHelp = true;
    this.permissions = "admin";
  }
  
  static get name() {
    return "del";
  }
  
  static get aliases() {
    return ["delete"];
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 1)) return;
    
    let deleted = 0;
    
    msg.client.getChannelLogs(msg.channel, (err, messages) => {
      if (err) {
        return msg.client.sendMessage(msg.channel, "```" + err + "```");
      }
      
      messages.forEach(m => {
        if (deleted >= args[0]) return;
        if (m.author === m.client.user) {
          msg.client.deleteMessage(m);
          deleted++;
        }
      });
    });
  }
}

module.exports = Del;