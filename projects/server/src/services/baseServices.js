const db = require(`../models`);

class Service {
  constructor(modelName) {
    this.db = db[modelName];
  }

  async getAll() {
    await this.db
      .findAll()
      .then((result) => result.dataValues)
      .catch((err) => {
        throw new Error(err?.message);
      });
  }

  async getByID(req) {
    const id = req.params;
    await this.db
      .findByPk(id)
      .then((result) => result.dataValues)
      .catch((err) => {
        throw new Error(err?.message);
      });
  }

  async create(req) {
    await this.db
      .create({
        ...req.body,
        logging: false,
      })
      .then((result) => {
        delete result.dataValues?.password;
        return result.dataValues;
      })
      .catch((err) => {
        throw new Error(err?.message);
      });
  }

  async update(req) {
    const { id } = req.params;
    await this.db
      .update({ ...req.body }, { where: { id }, logging: false })
      .then((result) => result.dataValues)
      .catch((err) => {
        throw new Error(err?.message);
      });
  }

  async delete(req) {
    const id = req.params;
    await this.db
      .destroy({ where: id })
      .then((result) => result)
      .catch((err) => {
        throw new Error(err?.message);
      });
  }
}

module.exports = Service;