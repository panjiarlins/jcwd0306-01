const Joi = require('joi');
const { sendResponse, validateJoiSchema } = require('../../utils');
const { ResponseError } = require('../../errors');

const categoryValidator = {
  createCategory: (req, res, next) => {
    try {
      validateJoiSchema(req.file, Joi.required().label('image'));

      validateJoiSchema(
        req.body,
        Joi.object({
          name: Joi.string().required(),
        }).required()
      );

      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },

  deleteCategoryById: (req, res, next) => {
    try {
      validateJoiSchema(
        req.params,
        Joi.object({
          id: Joi.number().integer().min(1).required(),
        }).required()
      );

      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },

  editCategoryById: (req, res, next) => {
    try {
      validateJoiSchema(
        req.params,
        Joi.object({
          id: Joi.number().integer().min(1).required(),
        }).required()
      );

      validateJoiSchema(req.file, Joi.optional().label('image'));

      validateJoiSchema(
        req.body,
        Joi.object({ name: Joi.string() }).required()
      );

      // check at least one column of table to be updated
      if (!req.file && Object.keys(req.body).length === 0)
        throw new ResponseError('no data provided', 400);

      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },

  getCategoryImageById: (req, res, next) => {
    try {
      validateJoiSchema(
        req.params,
        Joi.object({
          id: Joi.number().integer().min(1).required(),
        }).required()
      );

      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },

  getCategoryById: (req, res, next) => {
    try {
      validateJoiSchema(
        req.params,
        Joi.object({
          id: Joi.number().integer().min(1).required(),
        }).required()
      );

      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },
};

module.exports = categoryValidator;