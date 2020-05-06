import fs from 'fs';
import Menu from '../constants/menu';

export default class Validators {
  validateInputData(filePath) {
    function hasProp(object, key) {
      return Object.prototype.hasOwnProperty.call(object, key);
    }
    let orders = [];
    let response = { msg: '', err: false };
    try {
      orders = JSON.parse(fs.readFileSync(filePath));
      response = { msg: '', err: false, orders };
    } catch (error) {
      response = { msg: 'File is not valid JSON', err: true, orders };
    }
    if (orders.length === 0) {
      response = { msg: 'Data set has no records', err: true, orders };
    }
    orders.forEach((order, i) => {
      if (!hasProp(order, 'order_id')) {
        response = {
          msg: `Order ${i} is missing "order_id" prop`,
          err: true,
          orders
        };
      } else if (!hasProp(order, 'order_time')) {
        response = { 
          msg: `Order ${i} is missing "order_time" prop`, 
          err: true, 
          orders 
        };
      } else if (!hasProp(order, 'type')) {
        response = { 
          msg: `Order ${i} is missing "type" prop`, 
          err: true, 
          orders 
        };
      }
    });
    return response;
  }

  async validateFilePath(filePath) {
    try {
      await fs.promises.access(filePath);
    } catch (error) {
      return false;
    }
    return true;
  }

  validateFileType(filePath) {
    try {
      JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
      return false;
    }
    return true;
  }

  validateOrdersTimes(orders) {
    let response = { msg: '', err: false };
    orders.forEach(({ order_time }, i) => {
      if (order_time > 100) {
        response = {
          msg: `Order ${i} was made after working hours (${order_time})`,
          err: true,
        }
      }
    });
    return response;
  }

  validateInputPropTypes(orders) {
    let response = { msg: '', err: false };

    function drinkIsInMenu(inputType) {
      const drink = Menu.find(drink => inputType === drink.type);
      return typeof (drink) === 'object';
    }

    orders.forEach(({ order_time, order_id, type }, i) => {
      if (typeof (order_id) !== 'number') {
        response = { msg: `Order ${i} has a NaN "order_id" prop`, err: true };
      } else if (typeof (order_time) !== 'number') {
        response = { msg: `Order ${i} has a NaN "order_time" prop`, err: true };
      } else if (!drinkIsInMenu(type)) {
        response = {
          msg: `Order ${i} has an incorrect/uknown enum (${type}) "type" prop`,
          err: true
        };
      }
    });
    return response;
  }
}