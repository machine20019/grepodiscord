"use strict";

const util = require('util');
const google = require('google');
const Command = require('../../lib/Command');

class Google extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["google", "g"];
    this.group = "Misc";
    this.description = 'Get search results from google';
    this.usage = 'google <search string>';
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 1)) return;
    
    let bot = msg.client,
        results = [],
        link = {};
    
    bot.g = bot.g || {};
    
    if (args.length === 1 && args[0] === "next") {
      results = bot.g[msg.channel];
      
      while (!link.href && results.links.length) {
        link = results.links.shift();
      }
      
      if (!link.href) {
        this.sendMessage("I'm out of results");
        return;
      }
      
      this.sendMessage(link.href);
      link = {};
      return;
    }
    
    google.resultsPerPage = 10;
    google(args.join(' '), (err, res) => {
      if (err) { return this.log("Error", err); }
      
      if (!res.links.length) {
        return this.sendMessage("I didn't get any results");
      }
      
      bot.g[msg.channel] = res;
      
      while (!link.href && res.links.length) {
        link = res.links.shift();
      }
      
      results = res.links;
      
      this.sendMessage(link.href);
      
      link = {};
    });
  }
}

module.exports = Google;