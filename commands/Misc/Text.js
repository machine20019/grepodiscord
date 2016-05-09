"use strict";

const Command = require('../../lib/Command');

class Text extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["text", "shrug", "flip", "unflip"];
    this.group = "Misc";
    this.description = "A collection of text commands";
    this.hideFromHelp = true;
  }
  
  execute(msg, args, command) {
    super.execute.apply(this, arguments);
    let reply = "";
    
    switch (command) {
      case 'shrug':
        reply = '¯\\_(ツ)_/¯';
        break;
      case 'flip':
        reply = "ヽ(`Д´)ﾉ︵﻿ ┻━┻";
        break;
      case 'unflip':
        reply = "┬─┬﻿ ノ( ゜-゜ノ)";
        break;
    }
    
    if (reply.length) {
      this.sendMessage(reply);
    }
  }
}

module.exports = Text;