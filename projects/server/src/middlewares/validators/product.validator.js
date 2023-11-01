const Joi = require('joi');
const { sendResponse, validateJoiSchema } = require('../../utils');
const { ResponseError } = require('../../errors');

const productValidator = {
  createProduct: (req, res, next) => {
    try {
      validateJoiSchema(
        req.body,
        Joi.object({
          name: Joi.string().required(),
          description: Joi.string().required(),
          price: Joi.number().integer().min(0).required(),
          weight: Joi.number().min(0).required(),
          discount: Joi.number().min(0).max(1),
          categoryIds: Joi.array().items(Joi.number().integer().min(1)),
        }).required()
      );
      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },

  editProductByProductId: (req, res, next) => {
    try {
      validateJoiSchema(
        req.params,
        Joi.object({
          productId: Joi.number().integer().min(1).required(),
        }).required()
      );
      validateJoiSchema(
        req.body,
        Joi.object({
          name: Joi.string(),
          description: Joi.string(),
          price: Joi.number().integer().min(0),
          weight: Joi.number().min(0),
          discount: Joi.number().min(0).max(1),
          categoryIds: Joi.array().items(Joi.number().integer().min(1)),
        }).required()
      );
      if (Object.keys(req.body).length === 0)
        // check at least one column of table to be updated
        throw new ResponseError('no data provided', 400);
      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },

  getProducts: (req, res, next) => {
    try {
      validateJoiSchema(
        req.query,
        Joi.object({
          name: Joi.string().allow(''),
          categoryId: Joi.number().integer().min(1).allow(''),
          sortBy: Joi.string()
            .valid(
              'id',
              'name',
              'description',
              'price',
              'weight',
              'discount',
              'createdAt',
              'updatedAt'
            )
            .allow(''),
          orderBy: Joi.string().valid('ASC', 'asc', 'DESC', 'desc').allow(''),
          isPaginated: Joi.boolean().allow(''),
          page: Joi.number().integer().min(1).allow(''),
          perPage: Joi.number().integer().min(1).allow(''),
        })
      );
      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },

  getProductByProductId: (req, res, next) => {
    try {
      validateJoiSchema(
        req.params,
        Joi.object({
          productId: Joi.number().integer().min(1).required(),
        }).required()
      );
      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },

  getProductImageByImageId: (req, res, next) => {
    try {
      validateJoiSchema(
        req.params,
        Joi.object({
          imageId: Joi.number().integer().min(1).required(),
        }).required()
      );
      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },

  updateProductActivationByProductId: (req, res, next) => {
    try {
      validateJoiSchema(
        req.params,
        Joi.object({
          productId: Joi.number().integer().min(1).required(),
        }).required()
      );
      validateJoiSchema(
        req.query,
        Joi.object({
          action: Joi.string().valid('activate', 'deactivate').required(),
        }).required()
      );
      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },
};

module.exports = productValidator;
