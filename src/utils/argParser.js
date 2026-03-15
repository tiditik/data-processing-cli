export function parseArgs(argsString) {
    const args = {};
    const parts = argsString.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith('--')) {
            const key = parts[i].slice(2);
            
            const value = (parts[i + 1] && !parts[i + 1].startsWith('--')) ? parts[i + 1].replace(/"/g, '') : true;
            args[key] = value;
        }
    }
    return args;
}