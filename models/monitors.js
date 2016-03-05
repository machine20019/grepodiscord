"use strict"

module.exports = function (sequelize, DataTypes) {
  var Monitors = sequelize.define('Monitors', {
    server: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    channel: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    world: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    alliances: {
      type: DataTypes.TEXT
    },
    last_check: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'bot_monitors'
  });

  return Monitors;
};