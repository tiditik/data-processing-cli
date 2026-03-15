import fs from 'fs';
import { pipeline } from 'stream/promises';
import { resolvePath } from '../utils/pathResolver.js';
import { Transform } from 'stream';

export async function countCommand(args, currentDir) {
    if (!args.input) throw new Error('Missing input');
    
    const inputPath = resolvePath(currentDir, args.input);
    
    await fs.promises.access(inputPath, fs.constants.R_OK);

    let lines = 0;
    let words = 0;
    let chars = 0;
    let isLastCharWhitespace = true;

    const countStream = new Transform({
        transform(chunk, encoding, callback) {
            const text = chunk.toString('utf8');
            chars += text.length;
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === '\n') lines++;
                
                const isWhitespace = /\s/.test(char);
                if (!isWhitespace && isLastCharWhitespace) {
                    words++;
                }
                isLastCharWhitespace = isWhitespace;
            }
            callback();
        }
    });

    await pipeline(
        fs.createReadStream(inputPath),
        countStream
    );

    console.log(`Lines: ${lines}`);
    console.log(`Words: ${words}`);
    console.log(`Characters: ${chars}`);
}