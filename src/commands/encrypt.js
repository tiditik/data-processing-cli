import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { resolvePath } from '../utils/pathResolver.js';
import { Transform } from 'stream';

export async function encryptCommand(args, currentDir) {
    if (!args.input || !args.output || !args.password) {
        throw new Error('Missing required arguments');
    }

    const inputPath = resolvePath(currentDir, args.input);
    const outputPath = resolvePath(currentDir, args.output);

    await fs.promises.access(inputPath, fs.constants.R_OK);

    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.scryptSync(args.password, salt, 32);
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encryptStream = new Transform({
        construct(callback) {
            
            this.push(salt);
            this.push(iv);
            callback();
        },
        transform(chunk, encoding, callback) {
            const encrypted = cipher.update(chunk);
            if (encrypted.length > 0) this.push(encrypted);
            callback();
        },
        flush(callback) {
            cipher.final();
            const authTag = cipher.getAuthTag();
            this.push(authTag); 
            callback();
        }
    });

    await pipeline(
        fs.createReadStream(inputPath),
        encryptStream,
        fs.createWriteStream(outputPath)
    );
}