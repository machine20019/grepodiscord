"use strict";

const _ = require('underscore');
const vm = require('vm');
const util = require('util');
const stringify = require('json-stringify-safe');

module.exports = {
  name: "eval",
  aliases: ["e"],
  description: "Get bot info/stats.",
  usage: "eval [javascript]",
  hideFromHelp: true,
  permissions: "admin",
  callback: function (msg, command, args) {
    let msgArray = [],
        bot = this.bot,
        result;
    
    try {
      result = eval(args.join(' '));
    } catch (e) {
      result = e;
    }

    msgArray.push("```js");
    msgArray.push(result);
    msgArray.push("```");
    
    this.bot.sendMessage(msg.channel, msgArray);
  }
};