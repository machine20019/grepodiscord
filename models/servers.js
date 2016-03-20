"use strict";

module.exports = (sequelize, DataTypes) => {
  let Servers = sequelize.define('Servers', {
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