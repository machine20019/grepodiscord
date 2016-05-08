"use strict";

const fs = require('fs');
const path = require('path');
const config = require('./config');
const Datastore = require('nedb');

class Database {
  
  constructor(options) {
    this.db = {};
    
    this.create('auth');
    this.create('monitors');
    // this.create('messages');
    
    this.create('worlds', (err) => {
      if (err) return;
      this.db.worlds.ensureIndex({ fieldName: 'server', unique: true });
    });
    
    this.create('tags', (err) => {
      if (err) return;
      this.db.tags.ensureIndex({ fieldName: 'tag', unique: true });
    });
    
    return this.db;
  }
  
  create(name, onload) {
    let file = path.join(config.dbPath, name + '.db');
    
    this.db[name] = new Datastore({
      filename: file,
      autoload: true,
      onload: onload
    });
    
    return this.db[name];
  }
  
  get(name) {
    return this.db[name];
  }
  
}

module.exports = Database;