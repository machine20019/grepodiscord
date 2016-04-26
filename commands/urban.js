"use strict";

const util = require('util');
const urban = require('urban');
const logger = require('../lib/logger');

module.exports = {
  name: "urban",
  aliases: ["urb"],
  description: "Gets the first result from urban dictionary",
  usage: "urban",
  callback: function (msg, command, args) {
    let msgArray = [];

    if (!args.length) {
      return this.bot.sendMessage(msg.channel, 'Give me something to search');
    }
    
    let result = urban(args.join(' '));
    
    result.first(json => {
      if (!json || !json.definition) {
        return this.bot.sendMessage(msg.channel, "I didn't get any results");
      }
      
      msgArray.push(json.definition);
      msgArray.push("\n");
      msgArray.push(json.permalink);
      
      this.bot.sendMessage(msg.channel, msgArray);
    });
  }
};