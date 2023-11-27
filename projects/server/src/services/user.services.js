/* eslint-disable default-case */
const { Op } = require('sequelize');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const db = require('../models');
// const { sequelize } = require('../models');
const Service = require('./baseServices');
const mailer = require('../lib/nodemailer');
const { ResponseError } = require('../errors');
const {
  attributesCountStatus,
  includeOrderCart,
} = require('./user.service/optionGetDetailsByID');
const checkIsAdmin = require('./user.service/checkIsAdmin');

require('dotenv').config({
  path: path.resolve(__dirname, '..', '..', `.env.${process.env.NODE_ENV}`),
});
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

class User extends Service {
  getByID = async (req) => {
    const { id } = req.params;
    const decoded = jwt.verify(req.token, process.env.JWT_SECRET_KEY);
    if (decoded.id !== Number(id))
      throw new ResponseError('Invalid credential', 401);

    const user = await this.db.findByPk(id, {
      attributes: { exclude: ['password', 'image'] },
      include: [{ model: db.WarehouseUser, paranoid: false }],
      logging: false,
    });
    const allWarehouses = await checkIsAdmin(user);

    const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET_KEY, {
      expiresIn: '1h',
    });

    return { token, user };
  };

  findUser = async (email, config = []) => {
    try {
      const data = await this.db.findOne({
        where: {
          [Op.or]: [{ email }],
        },
        attributes: { exclude: ['password', ...config] },
        raw: true,
        logging: false,
      });
      return data;
    } catch (err) {
      return err;
    }
  };

  findUserEditPassword = async (email) => {
    try {
      const data = await this.db.findOne({
        where: {
          [Op.or]: [{ email }],
        },
        raw: true,
      });
      return data;
    } catch (err) {
      return err;
    }
  };

  mailerEmail = async (data, email, token) => {
    try {
      let template;
      let compiledTemplate;
      let subject;
      let html;
      const registrationLink = `${process.env.URL}verify`;

      switch (data) {
        case 'register':
          subject = 'email verification link';
          template = fs.readFileSync(
            path.join(__dirname, '../template/register.html'),
            'utf-8'
          );
          compiledTemplate = handlebars.compile(template);
          html = compiledTemplate({
            registrationLink,
            email,
          });
          break;
        case 'forget-password':
          subject = 'RESET PASSWORD';
          template = fs.readFileSync(
            path.join(__dirname, '../template/forgotPassword.html'),
            'utf-8'
          );
          compiledTemplate = handlebars.compile(template);
          html = compiledTemplate({
            registrationLink: `${process.env.URL}change-password?token=${token}`,
          });
          break;
      }
      mailer({
        subject,
        to: email,
        html,
      });
    } catch (err) {
      return err;
    }
  };

  verifyUser = async (body, t) => {
    try {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      const whereClause = {};
      if (body.email) whereClause.email = body.email;
      return await this.db.update(
        {
          firstName: body?.firstName,
          lastName: body?.lastName,
          password: hashedPassword,
          isVerified: 1,
        },
        { where: whereClause, transaction: t }
      );
    } catch (err) {
      return err;
    }
  };

  signIn = async (email, password, providerId, firstName, lastName, uid) => {
    let passwordNotCreated = false;
    const result = await this.db.findOne({
      where: {
        email,
      },
      include: [{ model: db.WarehouseUser, paranoid: false }],
      attributes: { exclude: ['image'] },
    });
    // kalo email gaada dan gaada providerId maka throw error
    if (!result && !providerId) {
      throw new Error('User not found');
    }

    // kalo emailnya gaada tapi ada providerId, maka push email dri fe ke db
    if (!result && providerId) {
      const hashedPassword = await bcrypt.hash('@NO_P455W0RD', 10);
      const googleLogin = await this.db.create({
        email,
        firstName,
        lastName,
        uuidGoogle: uid,
        isCustomer: 1,
        isAdmin: 0,
        isVerified: 1,
        password: hashedPassword,
      });

      const payload = googleLogin.toJSON();
      const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: '1h',
      });

      return { token, user: googleLogin };
    }

    // kalo gaada providerId, brti login biasa, maka cek passwordnya
    // cek kalo ada isi di kolom uid kasih return belum set password
    if (providerId !== 'google.com') {
      // kalo user login biasa pake email dari login google
      if (result.uuidGoogle !== null) {
        // cek apakah passwordnya default(password di db === '@N0_P455W0RD'), kalo iya return belum set password, kalo tidak lanjut validasi password
        const isDefaultPassword = await bcrypt.compare(
          '@NO_P455W0RD',
          result.getDataValue('password')
        );
        if (isDefaultPassword) {
          passwordNotCreated = true;
          result.setDataValue('isNotCreatePassword', passwordNotCreated);
          return result;
        }
      }

      const isValid = await bcrypt.compare(
        password,
        result.getDataValue('password')
      );
      if (!isValid) {
        throw new Error('wrong password');
      }
      result.setDataValue('password', undefined);
    }

    const payload = result.toJSON();
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: '1h',
    });

    return { token, user: result };
  };

  handleEdit = async (userId, req) => {
    const { isdefault, ...updatedData } = req.body;

    await this.db.update(updatedData, {
      where: { id: userId },
    });

    const result = await this.db.findByPk(userId);
    return result;
  };

  handleUploadAvatar = async (req) => {
    try {
      const { id } = req.body;
      req.body.avatar = await sharp(req.file.buffer).png().toBuffer();

      const data = await this.db.update(
        {
          image: req.body.avatar,
        },
        {
          where: { id },
        }
      );
      return data;
    } catch (error) {
      console.log(error);
    }
  };

  handleEditPassword = async (body, t) => {
    try {
      const { newPassword, email } = body;
      const hashPassword = await bcrypt.hash(newPassword, 10);
      const data = await this.db.update(
        { password: hashPassword },
        { where: { email }, transaction: t }
      );
      return data;
    } catch (err) {
      return err;
    }
  };

  getDetailsById = async (req) => {
    const result = await this.getOneByID(req, {
      attributes: attributesCountStatus(req),
      include: includeOrderCart,
      logging: false,
    });
    const order = this.encryptMultiResult({ count: 1, rows: result.UserOrder });
    return { ...result.dataValues, UserOrder: order.rows };
  };

  handleForgetPassword = async (email, hashPassword, t) => {
    try {
      const isUserExist = await this.findUser(email, ['image']);
      if (!isUserExist) throw new Error('User not Found!');

      const data = await this.db.update(
        { password: hashPassword, forget_password_token: null },
        { where: { email }, transaction: t, logging: false }
      );
      return data;
    } catch (error) {
      return error;
    }
  };

  pushToken = async (email, token) => {
    try {
      const result = await this.db.update(
        { forget_password_token: token },
        { where: { email }, logging: false }
      );
      return result;
    } catch (error) {
      return error;
    }
  };

  getUserImagebyId = async (req) => {
    const user = await this.db.findByPk(req.params.id, {
      attributes: ['image'],
      raw: true,
      logging: false,
    });
    if (!user?.image) throw new ResponseError('user image not found', 404);
    return user.image;
  };
}

module.exports = new User('User');
