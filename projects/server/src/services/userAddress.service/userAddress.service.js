const Service = require('../baseServices');
const db = require('../../models');
const { ResponseError } = require('../../errors');

class UserAddress extends Service {
  optionGetAddressByUserId = {
    include: [
      { model: db.Province, attributes: ['name'] },
      { model: db.City, attributes: ['name'] },
    ],
  };

  GOOGLEMAPS_API_KEY = process.env.Googlemaps_api_key;

  rajaOngkirHeader = {
    key: process.env.RajaOngkir_api_key,
    'content-type': 'application/json',
  };

  courier = ['jne', 'tiki', 'pos'];

  getAddressByUserId = (req) =>
    this.getByUserId(req, this.optionGetAddressByUserId);

  paymentOptions = async (req) => {
    const warehouse = await this.findNearestWareHouse(req);
    const body = {
      origin: warehouse.cityId,
      destination: req.body.cityId,
      weight: req.body.weight,
    };
    const paymentOption = await this.fetchRajaOngkir(body);
    return paymentOption;
  };

  findNearestWareHouse = async (req) => {
    const route = `https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix?`;
    const key = `key=${this.GOOGLEMAPS_API_KEY}`;
    const fields = `&fields=originIndex,destinationIndex,condition,distanceMeters,duration`;
    const destination = await UserAddress.getWarehouseAddress();
    const body = await UserAddress.optionGMAPSsetter([req.body], destination);
    const response = await fetch(route + key + fields, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return UserAddress.findTheSmallestDuration(result, destination);
  };

  static findTheSmallestDuration = (result, destination) => {
    const { destinationIndex } = result
      .filter((val) => val.condition === 'ROUTE_EXISTS')
      .sort((a, b) => parseInt(a.duration) - parseInt(b.duration))[0];

    return destination[destinationIndex];
  };

  static destinationFormater = (
    arrayOfDestination = [{ latitude: 0, longitude: 0 }]
  ) => {
    const formattedDestination = [];
    for (let i = 0; i < arrayOfDestination.length; i += 1) {
      formattedDestination.push({
        waypoint: {
          location: {
            latLng: {
              longitude: arrayOfDestination[i].longitude,
              latitude: arrayOfDestination[i].latitude,
            },
          },
        },
      });
    }
    return formattedDestination;
  };

  static optionGMAPSsetter(
    origins = [{ latitude: 0, longitude: 0 }],
    destination = [{ latitude: 0, longitude: 0 }]
  ) {
    const formattedOrigin = UserAddress.destinationFormater(origins);
    const formatedDestination = UserAddress.destinationFormater(destination);
    return {
      origins: formattedOrigin,
      destinations: formatedDestination,
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
    };
  }

  static getWarehouseAddress = async () => {
    try {
      const result = await db.WarehouseAddress.findAll({ logging: false });
      const temp = [];
      for (let i = 0; i < result.length; i += 1) {
        temp.push(result[i].dataValues);
      }
      return temp;
    } catch (error) {
      throw new ResponseError(error?.message);
    }
  };

  fetchRajaOngkir = async (body) => {
    const temp = [];
    const data = {};
    for (let i = 0; i < this.courier.length; i += 1) {
      body.courier = this.courier[i];
      const response = await fetch(`https://api.rajaongkir.com/starter/cost`, {
        method: 'POST',
        headers: this.rajaOngkirHeader,
        body: JSON.stringify(body),
      });
      const result = await response.json();
      temp.push(result.rajaongkir.results[0]);
      data.origin_details = result.rajaongkir.origin_details;
      data.destination_details = result.rajaongkir.destination_details;
    }
    data.method = UserAddress.shippingMethodFormatter(temp);
    return data;
  };

  static shippingMethodFormatter = (arr = []) => {
    const temp = [];
    for (let i = 0; i < arr.length; i += 1) {
      for (let j = 0; j < arr[i].costs.length; j += 1) {
        temp.push({
          name:
            arr[i].code === `pos`
              ? arr[i].costs[j].service
              : `${arr[i].code} ${arr[i].costs[j].service}`,
          description: arr[i].costs[j].description,
          price: arr[i].costs[j].cost[0].value,
          etd: `${arr[i].costs[j].cost[0].etd.split(' ')[0]} day(s)`,
        });
      }
    }
    return temp.sort((a, b) => a.price - b.price);
  };
}

module.exports = new UserAddress('UserAddress');