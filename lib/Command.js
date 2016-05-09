'use strict';

class Command {
  
  constructor(config) {
    this.config = config;
  }
  
  /**
   * @param {Array} args array of command arguments
   * @param {Number} length number of expected arguments
   * @returns {Boolean} returns true if arguments were validated.
   */
  validate(args, length) {
    if ((!args && length) || (length && args.length < length) || args[0] === "help") {
      this.help();
      return;
    }
    
    if (this.disableDM && !this.msg.channel.server) {
      this.sendMessage("This command doesn't work in DM");
      return;
    }
    
    return true;
  }
  
  /**
   * Generates help for the command based on properties defined by the command.
   */
  help() {
    let msgArray = [];
    
    if (!this.description) {
      return;
    }
    
    msgArray.push("```\n");
    msgArray.push(this.description);
    
    if (this.usage) {
      msgArray.push(`Usage: ${this.usage}`);
    }
    
    if (this.example) {
      msgArray.push(`Example: ${this.example}`);
    }
    
    msgArray.push("```");
    
    return this.msg.client.sendMessage(this.msg.channel, msgArray);
  }
  
  execute(msg, args) {
    this.msg = msg;
  }
  
  /**
   * Send message wrapper
   * @param {Mixed} message String or array to send to channel
   * @param {Function} [callback] optional callback
   */
  sendMessage(message, callback) {
    return this.msg.client.sendMessage(this.msg.channel, message, callback);
  }
  
  /**
   * Logs the command to the log channel if it exists.
   * @param {String} level
   * @param {String} message
   */
  log(level, message) {
    if (!this.config.logChannel) {
      return;
    }
    
    this.msg.client.sendMessage(this.config.logChannel, message);
  }
}

module.exports = Command;