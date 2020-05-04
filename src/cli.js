import arg from 'arg';
import inquirer from 'inquirer';
import { startCafe } from './main';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--useDefault': Boolean,
            '--install': Boolean,
            '--data': String,
            '--method': String,
            '-m': '--method',
            '-U': '--useDefault',
            '-d': '--data',
            '-i': '--install',
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        skipPrompts: args['--useDefault'] || false,
        jsonPath: args['--data'] || '',
        method: args['--method'] || '',
        template: args._[0], // all the extra args are here
        runInstall: args['--install'] || false,
    };
}

async function promptForMissingOptions(options) {
    const defaultMethod = 'FIFO';
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
            choices: ['FIFO', 'Optimized'],
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
        method: options.method || answers.method,
        jsonPath: options.jsonPath || answers.jsonPath
    };
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);
    await startCafe(options);
}