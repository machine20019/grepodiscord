"use strict";

const util = require('util');
const moment = require('moment');
const winston = require('winston');

module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      timestamp: () => {
        return new Date()
      },
      formatter: (options) => {
        let ts = util.format("[%s]", moment(options.timestamp()).format('HH:mm:ss')),
            level = winston.config.colorize(options.level) + ':';
        return ts +' '+ level +' '+ (undefined !== options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
      }
    })
  ],
  exitOnError: false
});