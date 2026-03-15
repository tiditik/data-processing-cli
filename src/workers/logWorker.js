import { workerData, parentPort } from 'worker_threads';
import fs from 'fs';

async function processChunk() {
    const { filePath, start, end, isFirstChunk } = workerData;
    const stream = fs.createReadStream(filePath, { start });
    
    let currentBytePos = start;
    let leftover = '';
    let skipFirstLine = !isFirstChunk;
    
    const stats = { total: 0, totalTime: 0, levels: {}, status: {}, pathCounts: {} };

    for await (const chunk of stream) {
        const text = leftover + chunk.toString();
        const lines = text.split('\n');
        leftover = lines.pop(); 

        for (const line of lines) {
            currentBytePos += Buffer.byteLength(line) + 1;
            
            if (skipFirstLine) {
                skipFirstLine = false;
                continue; 
            }

            if (line.trim()) {
                const parts = line.trim().split(' ');
                if (parts.length >= 7) {
                    const [, level, , statusCode, timeStr, , reqPath] = parts;
                    stats.total++;
                    stats.levels[level] = (stats.levels[level] || 0) + 1;
                    const statusClass = `${statusCode[0]}xx`;
                    stats.status[statusClass] = (stats.status[statusClass] || 0) + 1;
                    stats.totalTime += parseInt(timeStr, 10) || 0;
                    stats.pathCounts[reqPath] = (stats.pathCounts[reqPath] || 0) + 1;
                }
            }

            if (currentBytePos > end) {
                stream.destroy();
                parentPort.postMessage(stats);
                return;
            }
        }
    }
    
    parentPort.postMessage(stats);
}

processChunk().catch(err => { throw err; });