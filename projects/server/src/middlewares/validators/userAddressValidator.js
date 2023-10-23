const Joi = require('joi');
const { sendResponse, validateJoiSchema } = require('../../utils');
const { ResponseError } = require('../../errors');

const addressSchema = Joi.object({
  receiverPhone: Joi.string().required().regex(/^\d+$/),
  receiverName: Joi.string().min(3).required(),
  postalCode: Joi.number().min(10000).required(),
  provinceId: Joi.number().min(1).required(),
  cityId: Joi.number().min(1).required(),
  district: Joi.string().min(3).required(),
  village: Joi.string().min(3).required(),
  detail: Joi.string().min(3).required(),
}).unknown(true);

const addressValidator = {
  addAndUpdate: (req, res, next) => {
    try {
      if (Number(req.params.userId) !== req.body.userId)
        throw new ResponseError('Invalid userId', 400);
      validateJoiSchema(req.body, addressSchema);
      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },
  longLatGenerator: async (req, res, next) => {
    try {
      const { detail, village, district, City, Province } = req.body;
      const place = encodeURIComponent(
        `${detail}, ${village}, ${district}, ${City.name}, ${Province.name}`
      );
      const rawData = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?key=${process.env.OpenCage_api_key}&q=${place}`
      );
      const result = await rawData.json();
      req.body.latitude = result.results[0].geometry.lat;
      req.body.longitude = result.results[0].geometry.lng;

      next();
    } catch (error) {
      sendResponse({ res, error });
    }
  },
};

module.exports = addressValidator;