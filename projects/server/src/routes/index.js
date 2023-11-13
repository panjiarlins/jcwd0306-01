const carouselRouter = require('./carousel.route');
const cartRouter = require('./cart.route');
const categoryRouter = require('./category.route');
const userRouter = require('./user.route');
const productRouter = require('./product.route');
const userAddressRouter = require('./userAddress.route');
const provinceRouter = require('./province.route');
const cityRouter = require('./city.route');
const orderRouter = require('./order.route');
const warehouseRouter = require('./warehouse.route');
const warehouseUserRouter = require('./warehouseuser.route');
const stockMutationRouter = require('./stockmutation.route');

module.exports = {
  carouselRouter,
  cartRouter,
  categoryRouter,
  productRouter,
  userRouter,
  userAddressRouter,
  provinceRouter,
  cityRouter,
  orderRouter,
  warehouseRouter,
  warehouseUserRouter,
  stockMutationRouter,
};
