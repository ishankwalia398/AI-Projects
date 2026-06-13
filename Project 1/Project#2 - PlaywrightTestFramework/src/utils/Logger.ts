import fs from 'fs';
import path from 'path';

class Logger {
    private logDir: string = path.join(process.cwd(), 'logs');

    constructor() {
        this.ensureLogDirectory();
    }

    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private getTimestamp(): string {
        return new Date().toISOString();
    }

    private writeLog(level: string, message: string): void {
        const logEntry = `[${this.getTimestamp()}] [${level}] ${message}`;
        console.log(logEntry);

        const logFile = path.join(this.logDir, 'automation.log');
        fs.appendFileSync(logFile, logEntry + '\n');
    }

    public info(message: string): void {
        this.writeLog('INFO', message);
    }

    public warn(message: string): void {
        this.writeLog('WARN', message);
    }

    public error(message: string): void {
        this.writeLog('ERROR', message);
    }

    public debug(message: string): void {
        this.writeLog('DEBUG', message);
    }

    public pass(testName: string): void {
        this.writeLog('PASS', `✓ ${testName} PASSED`);
    }

    public fail(testName: string, error: string): void {
        this.writeLog('FAIL', `✗ ${testName} FAILED - ${error}`);
    }
}

export const logger = new Logger();
