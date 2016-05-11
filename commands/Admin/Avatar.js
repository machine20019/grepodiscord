"use strict";

const request = require('request');
const Command = require('../../lib/Command');

class Avatar extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["avatar", "av"];
    this.group = "Admin";
    this.description = "Set the bot avatar";
    this.usage = "avatar <url>";
    this.permissions = "admin";
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 1)) return;
    
    request({
      method: 'GET',
      url: args[0],
      encoding: null
    }, (err, res, image) => {
      if (err) return this.sendMessage("Failed to get a valid image.");
      
      msg.client.setAvatar(image, (err) => {
        if (err) return this.sendMessage("Failed setting avatar.");
        return this.sendMessage("Changed avatar.");
      });
    });
  }
}

module.exports = Avatar;