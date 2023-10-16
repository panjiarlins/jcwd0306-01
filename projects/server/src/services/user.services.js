// const { Op } = require('sequelize');
const db = require('../models');
// const { sequelize } = require('../models');
const Service = require('./baseServices');

class User extends Service {
  getByID = async (req) => {
    const { id } = req.params;
    try {
      const users = await this.db.findAll({
        where: { id },
      });
      return users;
    } catch (error) {
      throw new Error(error?.message);
    }
  };
}

module.exports = new User('User');