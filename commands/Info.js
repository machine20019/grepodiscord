"use strict";

const util = require('util');
const os = require('os');
const pkg = require('../package.json');
const moment = require('moment');
const config = require('../lib/config');
const Command = require('../lib/Command');

require("moment-duration-format");

class Info extends Command {
  
  constructor(config) {
    super(config);
    
    this.group = "Misc";
    this.description = "Get bot info/stats.";
    this.usage = "info";
    this.hideFromHelp = true;
  }
  
  static get name() {
    return "info";
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    
    let uptime = moment.duration(process.uptime(), "seconds"),
        cpus = os.cpus(),
        msgArray = [];
    
    msgArray.push("```xl");
    msgArray.push("Bot");
    msgArray.push(util.format("GrepoDiscord  | %s", config.version));
    msgArray.push(util.format("GitHub        | %s", pkg.homepage));
    msgArray.push("Author        | NoobLance");
    msgArray.push(util.format("Servers       | %d", msg.client.servers.length));
    msgArray.push(util.format("Channels      | %d", msg.client.channels.length));

    msgArray.push("\nHardware");
    msgArray.push(util.format("CPU           | %s", cpus[0].model));
    msgArray.push(util.format("CPU Speed     | %sGHz", (cpus[0].speed/1000)));
    msgArray.push(util.format("Cores         | %s", cpus.length));
    msgArray.push(util.format("Architecture  | %s", os.arch()));
    msgArray.push(util.format("Platform      | %s", os.platform()));
    msgArray.push("```");
    
    this.sendMessage(msgArray);
  }
}

module.exports = Info;