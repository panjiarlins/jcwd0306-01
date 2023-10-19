const sharp = require('sharp');
const { sendResponse } = require('../utils');
const { carouselService } = require('../services');

const carouselController = {
  createCarousel: async (req, res) => {
    try {
      req.body.image = await sharp(req.file.buffer).png().toBuffer();
      const carousel = await carouselService.createCarousel(req);
      sendResponse({ res, statusCode: 201, data: carousel });
    } catch (error) {
      sendResponse({ res, error });
    }
  },
};

module.exports = carouselController;