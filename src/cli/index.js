import arg from 'arg';
import inquirer from 'inquirer';
import CoffeShop from '../methods/coffeeShop';
import { startCafe } from './tasks';
import Menu from '../constants/menu';
const coffeeShop = new CoffeShop();

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--useDefault': Boolean,
      '--install': Boolean,
      '--logInput': Boolean,
      '--verbose': Boolean,
      '--data': String,
      '--method': String,
      '-m': '--method',
      '-U': '--useDefault',
      '-d': '--data',
      '-i': '--install',
      '-l': '--logInput',
      '-v': '--verbose',
    },
    {
      argv: rawArgs.slice(2),
    }
  );
  return {
    skipPrompts: args['--useDefault'] || false,
    jsonPath: args['--data'] || '',
    method: args['--method'].toLowerCase() || '',
    template: args._[0], // all the extra args are here
    runInstall: args['--install'] || false,
    logInput: args['--logInput'] || false,
    verbose: args['--verbose'] || false,
  };
}

async function promptForMissingOptions(options) {
  const defaultMethod = 'fifo';
  const questions = [];
  if (options.skipPrompts) {
    console.log(chalk.blue.bold('%s Using default method FIFO'));
    questions.push({
      type: 'input',
      name: 'jsonPath',
      message: 'Enter path to a valid JSON input file',
      default: '',
    });
    return {
      ...options,
      method: options.method || defaultMethod,
      jsonPath: options.jsonPath || answers.jsonPath
    };
  }

  if (!options.method) {
    questions.push({
      type: 'list',
      name: 'method',
      message: 'Choose a method to continue.',
      choices: ['fifo', 'optimized'],
      default: defaultMethod,
    });
  }

  if (!options.jsonPath) {
    questions.push({
      type: 'input',
      name: 'jsonPath',
      message: 'Enter a path to a valid JSON input file',
      default: '',
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    method: options.method || answers.method.toLowerCase(),
    jsonPath: options.jsonPath || answers.jsonPath
  };
}

async function promptForNewEntries({ orders }) {
  const continueQuestion = [];
  const newOrderQuestions = [];
  const defaultOrderTime = coffeeShop.getLastOrderTime(orders);
  let newOrders = [];

  continueQuestion.push({
    type: 'confirm',
    name: 'addNew',
    message: 'Wish to add a new order? ("No" will exit the program).',
    default: false,
  });

  const answers = await inquirer.prompt(continueQuestion);

  if (answers.addNew) {
    newOrderQuestions.push({
      type: 'list',
      name: 'type',
      message: 'Choose a drink type to continue.',
      choices: Menu.map(drink => drink.type),
      default: Menu.map(drink => drink.type)[0],
    });

    newOrderQuestions.push({
      type: 'number',
      name: 'order_time',
      message: `Choose a time in which the order was made, only after ${defaultOrderTime - 1}`,
      default: defaultOrderTime,
      validate: (answer) => {
        if (answer >= defaultOrderTime && answer <= 100) return true;
        return "Numbers only. Past orders and orders after 100 are NOT allowed";
      }
    });

    const drinkInfo = await inquirer.prompt(newOrderQuestions);
    const newOrder = {
      order_id: coffeeShop.createNewOrderID(orders),
      order_time: drinkInfo.order_time,
      type: drinkInfo.type,
    }
    newOrders = [...orders, newOrder];
    return newOrders;
  }

  return [];
}

export async function cli(args) {
  let shouldAddNewOrder = true;
  let newOrders = [];
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);

  while (shouldAddNewOrder) {
    const dailyReport = await startCafe(options, newOrders);
    if (dailyReport.tasksErr) {
      shouldAddNewOrder = false;
      return;
    }
    newOrders = await promptForNewEntries({
      drinks: dailyReport.drinks,
      orders: dailyReport.orders
    });
    if (newOrders.length === 0) {
      shouldAddNewOrder = false;
    }
  }
}