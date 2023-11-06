const { Warehouse, WarehouseAddress, Province, City } = require('../../models');

async function getWarehouses() {
  const warehouses = Warehouse.findAll({
    paranoid: false,
    include: [
      {
        model: WarehouseAddress,
        include: [{ model: Province }, { model: City }],
      },
    ],
    logging: false,
  });
  return warehouses;
}

module.exports = getWarehouses;
