import * as vscode from 'vscode';

// Define the ILogger interface
interface ILogger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

class Logger implements ILogger {
    private outputChannel: vscode.OutputChannel;

    constructor(channelName: string) {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
    }

    info(message: string) {
        this.log('INFO', message);
    }

    warn(message: string) {
        this.log('WARNING', message);
    }

    error(message: string) {
        this.log('ERROR', message);
    }

    private log(level: string, message: string) {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
    }
}

// Ensure the logger object is typed as ILogger
export const logger: ILogger = new Logger('Comment Toolkit');
