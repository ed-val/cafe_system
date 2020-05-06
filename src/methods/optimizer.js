import Menu from '../constants/menu';
import Helpers from './helpers';

export default class Optimizer extends Helpers {
  constructor(props) {
    super(props);
    this.state = {
      brewsByPriority: [], // simple list of brews available, in order of priority
      newMenu: [], // a menu that also holds a profitability prop
    }
    this._getMostProfitableBrews(Menu);
  }

  _getMostProfitableBrews(Menu) {
    // profitability roughly translate to the amount of profits per unit of time
    // the bigger the number, the higher priority it has on bottlenecks
    const menuWithProfitability = Menu.map(item => {
      return { ...item, profitability: item.profit / item.brew_time };
    });
    const bestbrews = menuWithProfitability.sort(
      (a, b) => (a.profitability < b.profitability) ? 1 : -1
    );
    this.state.newMenu = menuWithProfitability;
    this.state.brewsByPriority = bestbrews.map(({ type }) => {
      return type;
    });
  }

  findBottleNecks(orders) {
    const bottleNecks = [];
    const bottleNecksTimes = [];

    orders.forEach((order) => {
      const bottleneckTime = bottleNecksTimes.find(bn_time => {
        return order.order_time === bn_time;
      });
      //skip iteration if bottleneck time is alerady registered
      if (typeof (bottleneckTime) !== 'number') {
        // get all orders with the same time (bottlenecks) from the list of orders
        // altough in a real world implementation is never gonna be the exact same time
        // and should insted search for all orders within 2 or 4 minutes from each other
        const bottleNeck = orders.filter(({ order_time }) => order_time === order.order_time);
        if (bottleNeck.length > 1) {
          bottleNecksTimes.push(order.order_time)
          bottleNecks.push(bottleNeck);
        } else { //if theres only one item means there are no bottlenecks at this time
          bottleNecks.push(order);
        }
      }
    });
    return bottleNecks;
  }

  optimizeForProfit(orders) {
    const ordersGroupedByTime = this.findBottleNecks(orders);
    const optimizedOrders = [];
    ordersGroupedByTime.forEach(order => {
      // if the order is a list, that means its a bottleneck
      // (a group of orders with same time and should be optimized)
      if (Array.isArray(order)) {
        // brewsByPriority tells us which brews to make first based
        // on its profitability
        this.state.brewsByPriority.forEach(brewName => {
          const optimizedBottleNeck = order.filter(({ type }) => brewName === type);
          // Used forEach bellow instead of map to avoid creating a list of arrays
          optimizedBottleNeck.forEach(item => {
            optimizedOrders.push(item)
          });
        });
      } else {
        optimizedOrders.push(order);
      }
    });
    return optimizedOrders;
  }

  getAnalitics(orders, drinks) {
    // iterate first over drinks because there is always going to be
    // as many drinks as there are orders BUT NOT viceversa (avoiding bugs)
    const waitingTimes = drinks.map(drink => {
      const sameOrderID = orders.find(order => drink.order_id === order.order_id);
      return drink.start_time - sameOrderID.order_time;
    });
    let totalWaitingTime = 0;
    waitingTimes.forEach(time => { totalWaitingTime = totalWaitingTime + time });
    const awt = totalWaitingTime / waitingTimes.length;
    
    // const numberOfDrinksMade = drinks.length;
    let totalProfitMade = 0;
    drinks.forEach(drink => {
      const selectedOrder = orders.find(order => order.order_id === drink.order_id);
      const selectedBrew = Menu.find(brew => selectedOrder.type == brew.type);
      totalProfitMade = totalProfitMade + selectedBrew.profit;
    });

    return {
      averageWaitingTime: awt,
      totalProfitMade,
      numberOfDrinksMade: drinks.length
    }
  }
}