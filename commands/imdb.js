"use strict";

const util = require('util');
const stream = require('stream');
const omdb = require('omdb')
const logger = require('../lib/logger');

module.exports = {
  name: "imdb",
  description: "Gets the first result from imdb",
  usage: "imdb [search string]",
  callback: function (msg, command, args) {
    if (!args.length) {
      return this.bot.sendMessage(msg.channel, 'Give me something to search');
    }
    
    omdb.get(args.join(' '), (err, movie) => {
      if (err) {
        return msg.reply(err);
      }
      var msgArray = [],
          url = util.format("http://www.imdb.com/title/%s", movie.imdb.id);
      
      console.log(movie);
      
      msgArray.push(util.format("Title:%s (%s)", movie.title, movie.year));
      msgArray.push(url);
      // msgArray.push(movie.poster);
      
      this.bot.sendMessage(msg.channel, msgArray);
    });
  }
};