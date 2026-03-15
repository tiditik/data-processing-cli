import readline from 'readline';
import { homedir } from 'os';
import { handleNavigation } from './navigation.js';
import { parseArgs } from './utils/argParser.js';

import { csvToJsonCommand } from './commands/csvToJson.js';
import { jsonToCsvCommand } from './commands/jsonToCsv.js';
import { countCommand } from './commands/count.js';
import { hashCommand } from './commands/hash.js';
import { hashCompareCommand } from './commands/hashCompare.js';
import { encryptCommand } from './commands/encrypt.js';
import { decryptCommand } from './commands/decrypt.js';
import { logStatsCommand } from './commands/logStats.js';

export class REPL {
    constructor() {
        this.currentDir = homedir();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> '
        });
    }

    start() {
        console.log("Welcome to Data Processing CLI!");
        console.log(`You are currently in ${this.currentDir}`);
        this.rl.prompt();

        this.rl.on('line', async (line) => {
            const input = line.trim();
            if (input === ".exit") {
                this.rl.close();
                return;
            }
            if (input) {
                await this.handleCommand(input);
            }
            this.rl.prompt();
        }).on('close', () => {
            console.log('\nThank you for using Data Processing CLI!');
            process.exit(0);
        });
    }

    async handleCommand(input) {
        const parts = input.split(/\s+/);
        const command = parts[0];
        const args = parseArgs(input.substring(command.length));

        try {
            if (['up', 'cd', 'ls'].includes(command)) {
                this.currentDir = await handleNavigation(command, parts[1], this.currentDir);
                if (command !== 'ls') console.log(`You are currently in ${this.currentDir}`);
                return;
            }

            switch (command) {
                case 'csv-to-json':
                    await csvToJsonCommand(args, this.currentDir);
                    break;
                case 'json-to-csv':
                    await jsonToCsvCommand(args, this.currentDir);
                    break;
                case 'count':
                    await countCommand(args, this.currentDir);
                    break;
                case 'hash':
                    await hashCommand(args, this.currentDir);
                    break;
                case 'hash-compare':
                    await hashCompareCommand(args, this.currentDir);
                    break;
                case 'encrypt':
                    await encryptCommand(args, this.currentDir);
                    break;
                case 'decrypt':
                    await decryptCommand(args, this.currentDir);
                    break;
                case 'log-stats':
                    await logStatsCommand(args, this.currentDir);
                    break;
                default:
                    console.log('Invalid input');
                    return;
            }
            
            console.log(`You are currently in ${this.currentDir}`);
            
        } catch (error) {
            console.log('Operation failed');
            
        }
    }
}