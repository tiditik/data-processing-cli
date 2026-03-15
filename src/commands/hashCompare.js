import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { resolvePath } from '../utils/pathResolver.js';

export async function hashCompareCommand(args, currentDir) {
    if (!args.input || !args.hash) throw new Error('Missing input or hash');
    const inputPath = resolvePath(currentDir, args.input);
    const hashPath = resolvePath(currentDir, args.hash);
    
    await fs.promises.access(inputPath, fs.constants.R_OK);
    
    const expectedHashRaw = await fs.promises.readFile(hashPath, 'utf8');
    const expectedHash = expectedHashRaw.trim().toLowerCase();

    const algorithm = args.algorithm || 'sha256';
    if (!['sha256', 'md5', 'sha512'].includes(algorithm)) throw new Error('Unsupported algorithm');

    const hash = crypto.createHash(algorithm);
    await pipeline(fs.createReadStream(inputPath), hash);

    const calculatedHash = hash.digest('hex').toLowerCase();

    if (calculatedHash === expectedHash) {
        console.log('OK');
    } else {
        console.log('MISMATCH');
    }
}