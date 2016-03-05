"use strict"

module.exports = function (sequelize, DataTypes) {
  var Servers = sequelize.define('Servers', {
    server: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    }
  }, {
    tableName: 'bot_servers'
  });

  return Servers;
};