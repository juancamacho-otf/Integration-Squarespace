const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../logs/app_logs.txt');
const PRODUCTION_MODE = true; 

const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const getTimestamp = () => new Date().toISOString();

const writeToFile = (level, message) => {
    if (PRODUCTION_MODE && level === 'INFO') {
        const isImportant = message.includes('[HEARTBEAT]') || 
                            message.includes('[SUCCESS]') || 
                            message.includes('[SYSTEM]') ||
                            message.includes('[MIGRATION]');
        
        if (!isImportant) return; 
    }

    const logLine = `[${getTimestamp()}] [${level}] ${message}\n`;

    if (level === 'ERROR') console.error(logLine.trim());
    else console.log(logLine.trim());

    fs.appendFile(LOG_FILE, logLine, (err) => {
        if (err) console.error("FATAL: Error writing to log file:", err);
    });
};

const logger = {
    info: (msg) => writeToFile('INFO', msg),
    error: (msg) => writeToFile('ERROR', msg),
    warn: (msg) => writeToFile('WARN', msg),
    
    getRecentLogs: async (lines = 100) => {
        if (!fs.existsSync(LOG_FILE)) return "Log file is empty.";

        try {
            const stats = fs.statSync(LOG_FILE);
            const fileSize = stats.size;
            const bufferSize = Math.min(50 * 1024, fileSize); 
            const buffer = Buffer.alloc(bufferSize);
            const startPosition = Math.max(0, fileSize - bufferSize);

            const fd = fs.openSync(LOG_FILE, 'r');
            fs.readSync(fd, buffer, 0, bufferSize, startPosition);
            fs.closeSync(fd);

            const data = buffer.toString('utf8');
            return data.split('\n').slice(-lines).join('\n');

        } catch (e) {
            return `Error reading logs safely: ${e.message}`;
        }
    },
    
    clearLogs: () => {
        try {
            fs.writeFileSync(LOG_FILE, '');
        } catch (e) {
            console.error("[ERROR] Could not clear logs.");
        }
    }
};

module.exports = logger;