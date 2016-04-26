"use strict";

var _cache = {},
    _limiter = {};

class Limiter {
  
  constructor() {
    _limiter = this;
    
    this.timer = setTimeout(function() {
      if (Object.keys(_cache.length)) {
        for 
      }
    }, 500);
  }
  
  get(msg) {
    let i = _cache[msg.channel.id] = _cache[msg.channel.id] || {count: 0, time: new Date()};
    i.count++;
  }
}