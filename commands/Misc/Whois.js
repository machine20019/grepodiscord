"use strict";

const util = require('util');
const Command = require('../../lib/Command');

class Whois extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["whois", "who"];
    this.group = "Misc";
    this.description = "Get user information.";
    this.usage = "whois <user mention>";
    this.example = "whois @NoobLance";
    this.disableDM = true;
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    
    if (!this.validate(args, 1)) return;
    
    if (msg.mentions.length === 0) {
      return this.sendMessage("Please mention the user.");
    }
    
    for (let i in msg.mentions) {
      let user = msg.mentions[i],
          msgArray = [];

      msgArray.push("```xl");
      msgArray.push(util.format("User:    %s", user.username));
      msgArray.push(util.format("Discrim: %s", user.discriminator));
      msgArray.push(util.format("ID:      %s", user.id));
      msgArray.push(util.format("Status:  %s", user.status));
      if (user.game) {
        msgArray.push(util.format("Game:    %s", user.game.name));
      }
      msgArray.push("```");
      this.sendMessage(msgArray);
    }
  }
}

module.exports = Whois;