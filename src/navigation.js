import path from 'path';
import fs from 'fs/promises';
import { resolvePath } from './utils/pathResolver.js';

export async function handleNavigation(command, target, currentDir) {
    if (command === 'up') {
        return path.resolve(currentDir, '..');
    } 
    
    if (command === 'cd') {
        if (!target) throw new Error('Target directory required');
        const newPath = resolvePath(currentDir, target);
        const stats = await fs.stat(newPath);
        if (!stats.isDirectory()) throw new Error('Not a directory');
        return newPath;
    } 
    
    if (command === 'ls') {
        const files = await fs.readdir(currentDir, { withFileTypes: true });
        
        const sortedFiles = files.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });

        for (const file of sortedFiles) {
            const type = file.isDirectory() ? 'folder' : 'file';
            console.log(`${file.name.padEnd(20)} [${type}]`);
        }
        return currentDir;
    }
}