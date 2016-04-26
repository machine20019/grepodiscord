"use strict";

const util = require('util');
const google = require('google');
const logger = require('../lib/logger');

module.exports = {
  name: "google",
  aliases: ["g"],
  description: "Gets the search results from google",
  usage: "google [search string]",
  callback: function (msg, command, args) {
    var results = [],
        link = {};
    
    this.bot.g = this.bot.g || {};

    if (!args.length) {
      return this.bot.sendMessage(msg.channel, 'Give me something to search');
    }
    
    if (args.length === 1 && args[0] === "next") {
      results = this.bot.g[msg.channel];
      
      while (!link.href && results.links.length) {
        link = results.links.shift();
      }
      
      if (!link.href) {
        this.bot.sendMessage(msg.channel, "I'm out of results");
        return;
      }
      
      this.bot.sendMessage(msg.channel, link.href);
      
      link = {};
      return;
    }
    
    google.resultsPerPage = 10;
    google(args.join(' '), (err, res) => {
      if (err) { return logger.error(err); }
      
      if (!res.links.length) {
        return this.bot.sendMessage(msg.channel, "I didn't get any results");
      }
      
      this.bot.g[msg.channel] = res;
      
      while (!link.href && res.links.length) {
        link = res.links.shift();
      }
      
      results = res.links;
      
      this.bot.sendMessage(msg.channel, link.href);
      
      link = {}
    });
  }
};