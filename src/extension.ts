// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { ColorWheel } from './colorwheel';
import { Timer } from './timer';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-gaming" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const startCmd = vscode.commands.registerCommand('vscode-gaming.start', () => {
    const config = vscode.workspace.getConfiguration();
    const gamingConfig = vscode.workspace.getConfiguration('gaming');
    const period: number = gamingConfig.period;
    const updateTime: number = gamingConfig.updateTime;
    const target: string = gamingConfig.target;

    const delta = (2.0 * Math.PI) / (period / updateTime);
    let shift = delta;

    const timer = Timer.getInstance();
    timer.start(() => {
      const color = ColorWheel.at(shift);
      config.update('workbench.colorCustomizations', { [target]: color.code() }, true);

      shift += delta;
    }, updateTime);
  });

  const stopCmd = vscode.commands.registerCommand('vscode-gaming.stop', () => {
    const timer = Timer.getInstance();
    timer.stop();
  });

  context.subscriptions.push(startCmd);
  context.subscriptions.push(stopCmd);
}

// This method is called when your extension is deactivated
export function deactivate() {}
