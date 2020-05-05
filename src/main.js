import chalk from 'chalk';
import fs from 'fs';
import Listr from 'listr';
import Fifo from './methods/fifo';
import Optimized from './methods/optimized';
const boxen = require('boxen');
let orders = [];
let drinks = []; // processed orders
let inputOK = true;
// import ncp from 'ncp';
// import path from 'path';
// import { promisify } from 'util';
// import execa from 'execa';
// import { projectInstall } from 'pkg-install';

// const access = promisify(fs.access);
// const copy = promisify(ncp);

// async function copyTemplateFiles(options) {
//   return copy(options.templateDirectory, options.targetDirectory, {
//     clobber: false,
//   });
// }

// async function initGit(options) {
//   const result = await execa('git', ['init'], {
//     cwd: options.targetDirectory,
//   });
//   if (result.failed) {
//     return Promise.reject(new Error('Failed to initialize git'));
//   }
//   return;
// }
function skipFileValidation(newOrders) {
  return newOrders.length > 0
    ? 'Input is no longer a JSON file'
    : undefined;
}

export function validateInputData(filePath) {
  function hasProp(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

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

export async function validateFilePath(filePath) {
  try {
    await fs.promises.access(filePath);
    // The check succeeded
  } catch (error) {
    // The check failed
    // console.error('%s File doesnt exists at this path', chalk.red.bold('ERROR'));
    return false;
  }
  return true;
}

export function validateFileType(filePath) {
  try {
    JSON.parse(fs.readFileSync(filePath));
    // console.log('%s File valid JSON', chalk.green.bold('DONE'));
  } catch (error) {
    // console.error('%s File is not JSON', chalk.red.bold('ERROR'));
    return false;
  }
  return true;
}

function validateOrdersTimes(orders) {
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

function logInputData(data, boxColor, header) {
  const dataForUser = data.map(item => JSON.stringify(item) + "\n");
  console.log(chalk.cyan.bold(header));
  console.log(
    boxen(
      dataForUser.toString(),
      { padding: 1, borderColor: boxColor, borderStyle: 'double' }
    )
  );
}

export async function startCafe(options, newOrders) {
  const fifo = new Fifo();
  const fifoTasks = new Listr([
    {
      title: 'Validating order times',
      task: () => {
        const evaluation = validateOrdersTimes(
          newOrders.length > 0 ? newOrders : orders
        );
        if (evaluation.err) {
          throw new Error(evaluation.msg);
        }
      }
    },
    {
      title: 'Working fifo algorithm',
      task: () => {
        drinks = fifo.sortOrders(newOrders.length > 0 ? newOrders : orders);
      }
    },
  ]);

  const optimizedTasks = new Listr([
    {
      title: 'Working optimized algorithm',
      task: () => {
        const optimized = new Optimized();
      }
    },
  ]);

  const validationTasks = new Listr([
    {
      title: 'Validating file path',
      task: async () => {
        if (!await validateFilePath(options.jsonPath)) {
          throw new Error('Input file does not exist at this path');
        }
      },
      skip: () => skipFileValidation(newOrders),
    },
    {
      title: 'Validating file extension',
      task: () => {
        if (!validateFileType(options.jsonPath)) {
          throw new Error('Input file is not valid JSON data');
        }
      },
      skip: () => skipFileValidation(newOrders),
    },
    {
      title: 'Validating input data',
      task: () => {
        const response = validateInputData(options.jsonPath);
        if (response.err) {
          throw new Error(response.msg);
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
    await validationTasks.run();
    console.log('%s Input ready', chalk.green.bold('DONE'));
    inputOK = true;
  } catch (error) {
    console.log('%s Input not ready', chalk.red.bold('ERROR'));
    inputOK = false;
  }

  if (options.method === 'fifo' && inputOK) {
    try {
      console.log(chalk.cyan.bold('BEGGINING FIFO SORTING'));
      await fifoTasks.run();
      if (options.logInput) logInputData(
        newOrders.length > 0 ? newOrders : orders,
        'blueBright',
        'Input',
      );
      logInputData(drinks, 'yellow', 'Output');
      console.log('%s Tasks ran ok', chalk.green.bold('DONE'));
    } catch (error) {
      console.log('%s One or more issues with tasks', chalk.red.bold('ERROR'));
      // console.error(error);
    }
  }

  if (options.method === 'optimized' && inputOK) {
    console.log(chalk.cyan.bold('BEGGINING OPTIMIZED SORTING'));
    await optimizedTasks.run();
    console.log('%s Tasks ran ok', chalk.green.bold('DONE'));
  }
  return {
    drinks,
    orders: newOrders.length > 0 ? newOrders : orders
  };
}