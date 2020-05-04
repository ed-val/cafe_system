import fs from 'fs';

export function validateInputData(filePath) {
  function hasProp(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  let orders = [];
  let response = { msg: '', err: false };
  try {
    orders = JSON.parse(fs.readFileSync(filePath));
    // console.log(orders);
  } catch (error) {
    response = { msg: 'File is not valid JSON', err: true };
  }
  if (orders.length === 0) {
    response = { msg: 'Data set has no records', err: true };
  }
  orders.forEach((order, i) => {
    // || !order.brew_time || !order.type
    if (!hasProp(order, 'order_id')) {
      response = { msg: `Order ${i} is missing "order_id" prop`, err: true };
    } else if (!hasProp(order, 'order_time')) {
      response = { msg: `Order ${i} is missing "order_time" prop`, err: true };
    } else if (!hasProp(order, 'type')) {
      response = { msg: `Order ${i} is missing "type" prop`, err: true };
    }
  });
  return response;
}