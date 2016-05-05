"use strict";

module.exports = (sequelize, DataTypes) => {
  let AdminServers = sequelize.define('AdminServers', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    default_role: {
      type: DataTypes.STRING,
      allowNull: true
    },
    info_channel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    info_message: {
      type: DataTypes.STRING,
      allowNull: true
    },
    default_channel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    show_joins: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    tableName: 'bot_admin_servers'
  });

  return AdminServers;
};