"use strict";

const util = require('util');
const moment = require('moment');
const Command = require('../../lib/Command');

require("moment-duration-format");

class Uptime extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["uptime", "up"];
    this.group = "Misc";
    this.description = "Get bot uptime";
    this.usage = "uptime";
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    
    let uptime = moment.duration(process.uptime(), "seconds");
    this.sendMessage(util.format("```Uptime: %s```", uptime.format("w [weeks] d [days], h [hrs], m [min], s [sec]")));
  }
}

module.exports = Uptime;