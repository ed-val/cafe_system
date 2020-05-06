import Menu from '../constants/menu';
import Helpers from './helpers'

export default class CoffeeShop extends Helpers {
  constructor(props) {
    super(props);
    this.state = {
      baristaOneFreeAt: 0,
      baristaTwoFreeAt: 0,
      startingTime: 0,
    }
  }

  assignOrder(orderDetails) {
    const { baristaOneFreeAt, baristaTwoFreeAt } = this.state;

    if (baristaOneFreeAt <= orderDetails.order_time) { // barista 1 is free
      return super._baristaOneStartsDrink(orderDetails);

    } else if (baristaTwoFreeAt <= orderDetails.order_time) { // barista 2 is free
      return super._baristaTwoStartsDrink(orderDetails);
    }

    // if both are busy, call the one is finishing sooner
    if (baristaOneFreeAt < baristaTwoFreeAt) {
      // barista one will be ready first
      return super._baristaOneWillStartDrink(orderDetails);
    } else {
      // barista two will be ready first
      return super._baristaTwoWillStartDrink(orderDetails);
    }
  }

  sortOrders(orders) {
    super.setStartingTime(orders);
    const drinks = orders.map((order) => {
      const brewTime = Menu.find(item => item.type === order.type).brew_time;
      const newDrink = this.assignOrder({
        ...order,
        brewTime,
      });
      return newDrink;
    });

    const doableDrinksBeforeCloseTime = drinks.filter(({ start_time }) => {
      return start_time <= 100
    });
    const undoableDrinks = drinks.filter(({ start_time }) => {
      return start_time > 100
    });
    return { 
      doable: doableDrinksBeforeCloseTime, 
      undoable: undoableDrinks,
    };
  }
}