import chalk from 'chalk';
import Listr from 'listr';
import CoffeeShop from '../methods/coffeeShop';
import Validators from '../methods/validators';
import Optimizer from '../methods/optimizer';

const boxen = require('boxen');
let orders = [];
let optimizedOrders = [];
let analitics = [];
let analiticsMessage = '';
let drinks = []; // processed orders
let undoableDrinks = [];
let inputOK = true;
let tasksErr = false;

function skipFileValidation(newOrders) {
  return newOrders.length > 0
    ? 'Input is no longer a JSON file'
    : undefined;
}

function logData(data, boxColor, header) {
  let dataForUser = [];
  if (data.length > 0 && typeof data !== 'string') {
    dataForUser = data.map(item => JSON.stringify(item) + "\n");
  } else if (typeof data === 'object') {
    dataForUser = JSON.stringify(data);
  } else if (typeof data === 'string') {
    dataForUser = data;
  }
  console.log(chalk.cyan.bold(header));
  console.log(
    boxen(
      dataForUser.toString(),
      { padding: 1, borderColor: boxColor, borderStyle: 'double' }
    )
  );
}

export async function startCafe(options, newOrders) {
  const coffeeShop = new CoffeeShop();
  const optimizer = new Optimizer();
  const validators = new Validators();

  const inputValidationTasks = new Listr([
    {
      title: 'Validating orders prop types',
      task: () => {
        const evaluation = validators.validateInputPropTypes(
          newOrders.length > 0 ? newOrders : orders
        );
        if (evaluation.err) {
          throw new Error(evaluation.msg);
        }
      }
    },
    {
      title: 'Validating order times',
      task: () => {
        const evaluation = validators.validateOrdersTimes(
          newOrders.length > 0 ? newOrders : orders
        );
        if (evaluation.err) {
          throw new Error(evaluation.msg);
        }
      }
    }
  ]);

  const fifoTasks = new Listr([
    {
      title: 'Working fifo algorithm',
      task: () => {
        const drinksProcessed = coffeeShop.sortOrders(
          newOrders.length > 0 ? newOrders : orders
        );
        drinks = drinksProcessed.doable;
        undoableDrinks = drinksProcessed.undoable;
      }
    },
  ]);

  const optimizedTasks = new Listr([
    {
      title: 'Working optimized algorithm',
      task: () => {
        optimizedOrders = optimizer.optimizeForProfit(
          newOrders.length > 0 ? newOrders : orders
        );
        const drinksProcessed = coffeeShop.sortOrders(optimizedOrders);
        drinks = drinksProcessed.doable;
        undoableDrinks = drinksProcessed.undoable;
      }
    },
    {
      title: 'Fetching analitics',
      task: () => {
        analitics = optimizer.getAnalitics(
          newOrders.length > 0 ? newOrders : orders, 
          drinks
        );
        analiticsMessage = `Average waiting time was: ${analitics.averageWaitingTime}
        Total profits made was: ${analitics.totalProfitMade}
        Number of drinks done was: ${analitics.numberOfDrinksMade}`;
      }
    },
  ]);

  const fileValidationTasks = new Listr([
    {
      title: 'Validating file path',
      task: async () => {
        if (!await validators.validateFilePath(options.jsonPath)) {
          throw new Error('Input file does not exist at this path');
        }
      },
      skip: () => skipFileValidation(newOrders),
    },
    {
      title: 'Validating file extension',
      task: () => {
        if (!validators.validateFileType(options.jsonPath)) {
          throw new Error('Input file is not valid JSON data');
        }
      },
      skip: () => skipFileValidation(newOrders),
    },
    {
      title: 'Validating input data',
      task: () => {
        const response = validators.validateInputData(options.jsonPath);
        if (response.err) {
          throw new Error(response.msg);
        } else {
          orders = response.orders;
        }
      },
      skip: () => skipFileValidation(newOrders),
    },
    // {
    //   title: 'Sorting Baristas Orders',
    //   task: () => initGit(options),
    // },
    // {
    //   title: 'Install dependencies',
    //   task: () =>
    //     projectInstall({
    //       cwd: options.targetDirectory,
    //     }),
    //   skip: () =>
    //     !options.runInstall
    //       ? 'Pass --install to automatically install dependencies'
    //       : undefined,
    // },
  ]);

  try {
    console.log(chalk.cyan.bold('VALIDATING INPUT FILE'));
    await fileValidationTasks.run();
    console.log('%s Input ready', chalk.green.bold('DONE'));
    inputOK = true;
  } catch (error) {
    console.log('%s Input not ready', chalk.red.bold('ERROR'));
    if (options.verbose) console.error(error);
    inputOK = false;
    tasksErr = true;
  }

  if (inputOK) {
    try {
      console.log(chalk.cyan.bold(
        `BEGINNING ${options.method.toUpperCase()} SORTING`
      ));
      await inputValidationTasks.run();
      if (options.method === 'fifo') await fifoTasks.run();
      if (options.method === 'optimized') await optimizedTasks.run();
      if (options.logInput) logData(
        newOrders.length > 0 ? newOrders : orders,
        'blueBright',
        'Input',
      );
      if (options.method === 'optimized' && options.logInput) {
        logData(optimizedOrders, 'blueBright', 'Optimized Input');
      }
      logData(drinks, 'yellow', 'Output');
      if (undoableDrinks.length > 0) {
        logData(undoableDrinks, 'red', 'Drinks that cant be done in work hours');
      }
      if (options.method === 'optimized' && options.logInput) {
        logData(analiticsMessage, 'yellow', 'Analitics');
      }
      console.log('%s All sorting tasks ran ok', chalk.green.bold('DONE'));
    } catch (error) {
      if (options.verbose) console.error(error);
      console.log('%s One or more issues with tasks', chalk.red.bold('ERROR'));
      tasksErr = true;
    }
  }
  return {
    drinks,
    orders: newOrders.length > 0 ? newOrders : orders,
    tasksErr,
  };
}