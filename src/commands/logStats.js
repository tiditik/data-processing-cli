import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { resolvePath } from '../utils/pathResolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function logStatsCommand(args, currentDir) {
    if (!args.input || !args.output) throw new Error('Missing input or output');
    const inputPath = resolvePath(currentDir, args.input);
    const outputPath = resolvePath(currentDir, args.output);
    
    const stats = await fs.stat(inputPath);
    const numCores = os.cpus().length;
    const chunkSize = Math.ceil(stats.size / numCores);
    const workers = [];
    const workerPath = path.join(__dirname, '../workers/logWorker.js');

    for (let i = 0; i < numCores; i++) {
        const start = i * chunkSize;
        const end = i === numCores - 1 ? stats.size : start + chunkSize;
        if (start >= stats.size) continue;

        workers.push(new Promise((resolve, reject) => {
            const worker = new Worker(workerPath, {
                workerData: { filePath: inputPath, start, end, isFirstChunk: i === 0 }
            });
            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', code => {
                if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
            });
        }));
    }

    const results = await Promise.all(workers);

    const finalStats = { total: 0, levels: {}, status: {}, topPaths: [], avgResponseTimeMs: 0 };
    let totalTime = 0;
    const pathCounts = {};

    for (const res of results) {
        finalStats.total += res.total;
        totalTime += res.totalTime;
        for (const [lvl, count] of Object.entries(res.levels)) finalStats.levels[lvl] = (finalStats.levels[lvl] || 0) + count;
        for (const [st, count] of Object.entries(res.status)) finalStats.status[st] = (finalStats.status[st] || 0) + count;
        for (const [p, count] of Object.entries(res.pathCounts)) pathCounts[p] = (pathCounts[p] || 0) + count;
    }

    if (finalStats.total > 0) finalStats.avgResponseTimeMs = Number((totalTime / finalStats.total).toFixed(2));
    
    finalStats.topPaths = Object.entries(pathCounts)
        .map(([p, count]) => ({ path: p, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    await fs.writeFile(outputPath, JSON.stringify(finalStats, null, 2));
}