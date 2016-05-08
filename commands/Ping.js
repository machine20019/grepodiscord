"use strict";

const fs = require('fs');
const path = require('path');
const config = require('../lib/config');
const Command = require('../lib/Command.js');

let img = fs.readFileSync(path.join(config.imagePath, "finger-trans-118.png"));

class Ping extends Command {
  
  constructor(config) {
    super(config);
    
    this.group = "Misc";
    this.description = 'Pings the bot';
    this.usage = 'ping';
  }
  
  /**
   * Command name to be registered
   */
  static get name() {
    return 'ping';
  }
  
  /**
   * @param {Object} msg
   * @param {String} command
   * @param {Array} args
   */
  execute(msg, args) {
    super.execute.apply(this, arguments);
    
    msg.client.sendFile(msg.channel, img, () => {
      this.sendMessage("Pong Motherfucker!");
    });
    
    this.log("Command", "Ping");
  }
}

module.exports = Ping;