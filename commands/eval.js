"use strict";

const _ = require('underscore');
const vm = require('vm');
const util = require('util');
const Command = require('../lib/Command.js');

class Eval extends Command {
  
  constructor(config) {
    super(config);
    
    this.group = "Admin";
    this.description = "Evaluate js code from discord";
    this.usage = "eval [javascript]";
    this.hideFromHelp = true;
    this.permissions = "admin";
  }
  
  static get name() {
    return "eval";
  }
  
  static get aliases() {
    return ["e"];
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    
    if (!this.validate(args, 1)) return;
    
    let msgArray = [],
        bot = msg.client,
        _ = require('underscore'),
        fs = require('fs'),
        path = require('path'),
        config = this.config,
        result;
    
    try {
      result = eval(args.join(' '));
    } catch (e) {
      result = e;
    }
    
    if (!result) return;
    
    msgArray.push("```js");
    msgArray.push(result);
    msgArray.push("```");
    
    this.sendMessage(msgArray);
  }
}

module.exports = Eval;