import * as vscode from 'vscode';

class Logger {
    private outputChannel: vscode.OutputChannel;

    constructor(channelName: string) {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
    }

    info(message: string) {
        this.log('INFO', message);
    }

    warning(message: string) {
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

export const logger = new Logger('Comment Toolkit');
