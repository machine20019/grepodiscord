"use strict";

const fs = require('fs');
const path = require('path');
const config = require('../lib/config');

module.exports = {
  name: "ping",
  description: "Ping the bot.",
  usage: "ping",
  hideFromHelp: true,
  callback: function (msg, command, args) {
    let msgArray = [],
        img = fs.readFileSync(path.join(config.imagePath, "finger.png"));
    
    this.bot.sendFile(msg.channel, img, () => {
      this.bot.sendMessage(msg.channel, "Pong Motherfucker");
    });
  }
};