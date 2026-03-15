import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import { resolvePath } from '../utils/pathResolver.js';

export async function decryptCommand(args, currentDir) {
    if (!args.input || !args.output || !args.password) throw new Error('Missing arguments');
    const inputPath = resolvePath(currentDir, args.input);
    const outputPath = resolvePath(currentDir, args.output);
    await fs.promises.access(inputPath, fs.constants.R_OK);

    let headerBuffer = Buffer.alloc(0);
    let tailBuffer = Buffer.alloc(0); 
    let isHeaderParsed = false;
    let decipher = null;

    const decryptStream = new Transform({
        transform(chunk, encoding, callback) {
            try {
                let currentChunk = chunk;

                if (!isHeaderParsed) {
                    headerBuffer = Buffer.concat([headerBuffer, currentChunk]);
                    if (headerBuffer.length >= 28) {
                        const salt = headerBuffer.subarray(0, 16);
                        const iv = headerBuffer.subarray(16, 28);
                        const key = crypto.scryptSync(args.password, salt, 32);
                        
                        decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
                        currentChunk = headerBuffer.subarray(28); 
                        isHeaderParsed = true;
                    } else {
                        return callback(); 
                    }
                }

                const combined = Buffer.concat([tailBuffer, currentChunk]);
                if (combined.length > 16) {
                    const toDecrypt = combined.subarray(0, combined.length - 16);
                    tailBuffer = combined.subarray(combined.length - 16);
                    
                    const decrypted = decipher.update(toDecrypt);
                    if (decrypted.length > 0) this.push(decrypted);
                } else {
                    tailBuffer = combined;
                }

                callback();
            } catch (err) {
                callback(err);
            }
        },
        flush(callback) {
            try {
                if (tailBuffer.length !== 16) throw new Error('Invalid format');
                decipher.setAuthTag(tailBuffer);
                const finalChunk = decipher.final(); 
                if (finalChunk.length > 0) this.push(finalChunk);
                callback();
            } catch (err) {
                callback(err);
            }
        }
    });

    await pipeline(fs.createReadStream(inputPath), decryptStream, fs.createWriteStream(outputPath));
}