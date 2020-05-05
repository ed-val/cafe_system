import Menu from './menu';

export default class sortFifo {
  constructor(props) {
    // super(props);
    this.state = {
      baristaOneFreeAt: 0,
      baristaTwoFreeAt: 0,
      startingTime: 0,
    }
  }

  assignBaristaToOrder({ order_time, order_id, brewTime }) {
    const {
      baristaOneFreeAt,
      startingTime,
      baristaTwoFreeAt
    } = this.state;

    if (baristaOneFreeAt <= order_time) { // barista 1 is free
      if (order_time === startingTime) {// barista 1 is starting the shift
        this.state.baristaOneFreeAt = startingTime + brewTime;
      } else { // barista 1 is idle and waiting new order
        this.state.baristaOneFreeAt = order_time + brewTime;
      }

      return {
        order_id,
        barista_id: 1,
        start_time: order_time // barista will start right away
      }

    } else if (baristaTwoFreeAt <= order_time) { // barista 2 is free

      if (order_time === startingTime) {
        // barista 2 is starting the shift
        this.state.baristaTwoFreeAt = startingTime + brewTime;
      } else {
        // barista 2 is idle and waiting new order
        this.state.baristaTwoFreeAt = order_time + brewTime;
      }

      return {
        order_id,
        barista_id: 2,
        start_time: order_time, // barista will start right away
      }
    }

    // if both are busy, call the one is finishing sooner
    if (baristaOneFreeAt < baristaTwoFreeAt) {
      // barista one is free first
      this.state.baristaOneFreeAt = baristaOneFreeAt + brewTime;
      return {
        order_id,
        barista_id: 1,
        start_time: baristaOneFreeAt //if barista is free, start time === order time
      }
    } else {
      // barista two is free first
      this.state.baristaTwoFreeAt = baristaTwoFreeAt + brewTime;
      return {
        order_id,
        barista_id: 2,
        start_time: baristaTwoFreeAt //if barista is free, start time === order time
      }
    }
  }

  createNewOrderID(orders) {
    const orderIDs = orders.map(drink => {
      return drink.order_id;
    });
    orderIDs.sort((a, b) => a - b);
    return orderIDs[orderIDs.length - 1] + 1;
  }

  getLastOrderTime(orders) {
    const ordersTimes = orders.map(drink => {
      return drink.order_time;
    });
    ordersTimes.sort((a, b) => a - b);
    return ordersTimes[ordersTimes.length - 1];
  }

  setStartingTime(orders) {
    const orderTimes = orders.map(drink => {
      return drink.order_time;
    });
    orderTimes.sort((a, b) => a - b);
    this.state.startingTime = orderTimes[0];
  }

  sortOrders(orders) {
    this.setStartingTime(orders);
    const drinks = orders.map((order, i) => {
      const brewTime = Menu.find(item => item.type === order.type).brew_time;
      const newDrink = this.assignBaristaToOrder({
        ...order,
        brewTime,
      });
      return newDrink;
    });
    return drinks;
  }
}