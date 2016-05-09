"use strict";

const _ = require('underscore');
const Command = require('../../lib/Command');

class Tags extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["tags"];
    this.group = "Misc";
    this.description = "Return a list of tags";
    this.usage = "tags";
    this.disableDM = true;
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate()) return;
    
    let db = msg.client.db;
    
    if (!db.tags) return;
    
    // get tags from db
    db.tags.find({}, (err, docs) => {
      if (err) return this.log("Error", err);
      
      if (!docs.length) {
        return this.sendMessage("0 tags found.");
      }
      
      let tags = _.pluck(docs, 'tag');
      
      return this.sendMessage(tags.join(', '));
    });
  }
}

module.exports = Tags;