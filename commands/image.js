"use strict";

const util = require('util');
const stream = require('stream');
const search = require('google-image-search');
const logger = require('../lib/logger');

module.exports = {
  name: "image",
  aliases: ["im"],
  description: "Gets the first result from google search",
  usage: "image [search string]",
  callback: function (msg, command, args) {
    let bufs = [],
        stream;
    
    if (!args.length) {
      return this.bot.sendMessage(msg.channel, 'Give me something to search');
    }
    
    stream = search(args.join(' '), err => {
      if (err) { logger.error(err); }
    });
    
    stream.on('data', data => {
      bufs.push(data);
    });
    stream.on('end', () => {
      let img = Buffer.concat(bufs);
      this.bot.sendFile(msg.channel, img);
    });
    stream.on('error', (err) => {
      logger.error(err);
    });
  }
};