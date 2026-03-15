import fs from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import { resolvePath } from '../utils/pathResolver.js';

export async function csvToJsonCommand(args, currentDir) {
    if (!args.input || !args.output) throw new Error('Missing input or output');
    const inputPath = resolvePath(currentDir, args.input);
    const outputPath = resolvePath(currentDir, args.output);
    await fs.promises.access(inputPath, fs.constants.R_OK);

    let headers = null;
    let leftover = '';
    let isFirstRow = true;

    const transformStream = new Transform({
        transform(chunk, encoding, callback) {
            const lines = (leftover + chunk.toString()).split('\n');
            leftover = lines.pop(); 

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                if (!headers) {
                    headers = trimmedLine.split(',');
                    this.push('[\n'); 
                } else {
                    const values = trimmedLine.split(',');
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index];
                    });
                    const prefix = isFirstRow ? '  ' : ',\n  ';
                    isFirstRow = false;
                    this.push(prefix + JSON.stringify(obj));
                }
            }
            callback();
        },
        flush(callback) {
            if (leftover.trim() && headers) {
                const values = leftover.trim().split(',');
                const obj = {};
                headers.forEach((header, index) => obj[header] = values[index]);
                const prefix = isFirstRow ? '  ' : ',\n  ';
                this.push(prefix + JSON.stringify(obj));
            }
            this.push('\n]\n'); 
            callback();
        }
    });

    await pipeline(fs.createReadStream(inputPath), transformStream, fs.createWriteStream(outputPath));
}