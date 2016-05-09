"use strict";

const util = require('util');
const os = require('os');
const moment = require('moment');
const Command = require('../../lib/Command');
const pkg = require('../../package.json');

require("moment-duration-format");

class Info extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["info"];
    this.group = "Misc";
    this.description = "Get bot info/stats.";
    this.usage = "info";
    this.hideFromHelp = true;
  }

  execute(msg, args) {
    super.execute.apply(this, arguments);
    
    let uptime = moment.duration(process.uptime(), "seconds"),
        cpus = os.cpus(),
        msgArray = [];
    
    msgArray.push("```xl");
    msgArray.push("Bot");
    msgArray.push(`GrepoDiscord  | ${this.config.version}`);
    msgArray.push(`Library       | ${this.config.lib}`);
    msgArray.push(`GitHub        | ${pkg.homepage}`);
    msgArray.push(`Author        | ${this.config.author}`);
    msgArray.push(`Servers       | ${msg.client.servers.length}`);
    msgArray.push(`Channels      | ${msg.client.channels.length}`);

    msgArray.push("\nHardware");
    msgArray.push(`CPU           | ${cpus[0].model}`);
    msgArray.push(`CPU Speed     | ${(cpus[0].speed/1000)}GHz`);
    msgArray.push(`Cores         | ${cpus.length}`);
    msgArray.push(`Architecture  | ${os.arch()}`);
    msgArray.push(`Platform      | ${os.platform()}`);
    msgArray.push("```");
    
    this.sendMessage(msgArray);
  }
}

module.exports = Info;