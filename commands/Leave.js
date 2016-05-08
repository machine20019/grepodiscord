"use strict";

const util = require('util');
const Command = require('../lib/Command.js');

class Leave extends Command {
  
  constructor(config) {
    super(config);
    
    this.group = "Server Manager";
    this.description = "Tells the bot to leave the server. Type the bot name to confirm.";
    this.usage = "leave <bot name>";
    this.permissions = "manageServer";
    this.disableDM = true;
  }
  
  static get name() {
    return 'leave';
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    
    if (!this.validate(args, 1)) return;
    
    if (args[0] !== msg.client.user.username) {
      return this.sendMessage("The argument provided does not match the bot username.");
    }
    
    if (!msg.channel.server) {
      return this.sendMessage("I can't leave a DM. Please use this command in a channel.");
    }
    
    if (!msg.channel.permissionsOf(msg.sender).hasPermission("manageServer")) {
      this.sendMessage("You don't have the permissions to use this command.");
      this.log("Unauthorized", `An unauthorized user (${msg.sender}) tried to make me leave the server (${msg.channel.server.name})`);
      return;
    }
    
    msg.client.leaveServer(msg.channel.server);
    this.log("Info", `Left server (${msg.channel.server.name}) requested by ${msg.sender.mention()}`);
  }
}

module.exports = Leave;