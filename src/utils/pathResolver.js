import path from 'path';

export function resolvePath(currentDir, targetPath) {
    if (!targetPath) return currentDir;
    return path.resolve(currentDir, targetPath);
}