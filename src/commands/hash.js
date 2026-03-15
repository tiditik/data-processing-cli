import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export async function hashCommand(args, currentDir) {
    if (!args.input) throw new Error('Missing input');
    const inputPath = resolvePath(currentDir, args.input);
    await fs.promises.access(inputPath, fs.constants.R_OK);

    const algorithm = args.algorithm || 'sha256';
    if (!['sha256', 'md5', 'sha512'].includes(algorithm)) throw new Error('Unsupported algorithm');

    const hash = crypto.createHash(algorithm);
    await pipeline(fs.createReadStream(inputPath), hash);

    const hex = hash.digest('hex');
    console.log(`${algorithm}: ${hex}`);

    if (args.save) {
        await fs.promises.writeFile(`${inputPath}.${algorithm}`, hex);
    }
}