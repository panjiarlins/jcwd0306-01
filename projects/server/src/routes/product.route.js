const router = require('express').Router();
const { productController } = require('../controllers');
const verifyAuthUser = require('../middlewares/auth/verifyAuthUser');
const multerBlobUploader = require('../middlewares/multers/multerBlobUploader');
const multerErrorHandler = require('../middlewares/multers/multerErrorHandler');
const { productValidator } = require('../middlewares/validators');

// create product
router.post(
  '/',
  multerBlobUploader().array('images'),
  multerErrorHandler,
  productValidator.createProduct,
  productController.createProduct
);

// edit product by productId
router.patch(
  '/:productId',
  multerBlobUploader().array('images'),
  multerErrorHandler,
  productValidator.editProductByProductId,
  productController.editProductByProductId
);

// get products
router.get('/', productValidator.getProducts, productController.getProducts);

// get product by productId
router.get(
  '/:productId',
  productValidator.getProductByProductId,
  productController.getProductByProductId
);

// get product image by productImageId
router.get(
  '/images/:imageId',
  productValidator.getProductImageByImageId,
  productController.getProductImageByImageId
);

// update product activation by productId
router.put(
  '/:productId',
  productValidator.updateProductActivationByProductId,
  productController.updateProductActivationByProductId
);

// update warehouse product stock
router.patch(
  '/:productId/warehouseproducts',
  verifyAuthUser({
    isLogin: true,
    isAdmin: true,
    isWarehouseAdmin: true,
    isVerified: true,
  }),
  productValidator.updateWarehouseProductStock,
  productController.updateWarehouseProductStock
);

module.exports = router;
