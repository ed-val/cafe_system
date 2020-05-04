import chalk from 'chalk';
import fs from 'fs';
// import ncp from 'ncp';
// import path from 'path';
// import { promisify } from 'util';
// import execa from 'execa';
import Listr from 'listr';
import { validateInputData } from './methods/fifo';
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

export async function validateFilePath(filePath) {
  let data = {};
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

export async function startCafe(options) {
  // options = {
  //   ...options,
  //   targetDirectory: options.targetDirectory || process.cwd(),
  // };

  // const currentFileUrl = import.meta.url;
  // const templateDir = path.resolve(
  //   new URL(currentFileUrl).pathname,
  //   '../../templates',
  //   options.template.toLowerCase()
  // );
  // options.templateDirectory = templateDir;

  // try {
  //   await access(templateDir, fs.constants.R_OK);
  // } catch (err) {
  //   console.error('%s Invalid template name', chalk.red.bold('ERROR'));
  //   process.exit(1);
  // }

  const tasks = new Listr([
    {
      title: 'Validating file path',
      task: async () => {
        if(!await validateFilePath(options.jsonPath)) {
          throw new Error('Input file does not exist');
        }
      }
    },
    {
      title: 'Validating file extension',
      task: () => {
        if(!validateFileType(options.jsonPath)) {
          throw new Error('Input file is not valid JSON data');
        }
      }
    },
    {
      title: 'Validating input data',
      task: () => {
        const response = validateInputData(options.jsonPath);
        if(response.err) {
          throw new Error(response.msg);
        }
      }
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

  await tasks.run();
  // console.log('Copy project files');
  // await copyTemplateFiles(options);

  console.log('%s Input ready', chalk.green.bold('DONE'));
  return true;
}