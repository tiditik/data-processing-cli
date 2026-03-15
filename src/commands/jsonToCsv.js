import fs from 'fs';
import fsPromises from 'fs/promises';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export async function jsonToCsvCommand(args, currentDir) {
    if (!args.input || !args.output) throw new Error('Missing input or output');
    const inputPath = resolvePath(currentDir, args.input);
    const outputPath = resolvePath(currentDir, args.output);

    const data = await fsPromises.readFile(inputPath, 'utf8');
    const jsonArray = JSON.parse(data);
    
    if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
        throw new Error('Invalid JSON format');
    }

    const headers = Object.keys(jsonArray[0]);

    const readableStream = new Readable({
        read() {
            this.push(headers.join(',') + '\n');
            for (const obj of jsonArray) {
                const row = headers.map(header => obj[header] || '').join(',');
                this.push(row + '\n');
            }
            this.push(null); 
        }
    });

    await pipeline(readableStream, fs.createWriteStream(outputPath));
}