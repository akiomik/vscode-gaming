// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { Timer } from './timer';

const mod2pi = (rad: number): number => {
  if (rad >= Math.PI) {
    return rad - (2.0 * Math.PI);
  }

  return rad;
};

const rad2hex = (rad: number): string => {
  const a= (Math.sin(rad) + 1.0) / 2.0;
  return Math.round(a * 255).toString(16).padStart(2, '0');
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-gaming" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-gaming.start', () => {
    const config = vscode.workspace.getConfiguration();
    const gamingConfig = vscode.workspace.getConfiguration('gaming');
    const period: number = gamingConfig.period;
    const updateTime: number = gamingConfig.updateTime;
    const target: string = gamingConfig.target;

    let radr = 0.0;
    let radg = 2.0 * Math.PI / 3.0;
    let radb = 2.0 * Math.PI / (2.0 / 3.0);
    let raddelta = 2.0 * Math.PI / (period / updateTime);

    const timer = Timer.getInstance();
    timer.start(() => {
      const color = `#${rad2hex(radr)}${rad2hex(radg)}${rad2hex(radb)}`;

      config.update('workbench.colorCustomizations', { [target]: color }, true);

      radr = mod2pi(radr + raddelta);
      radg = mod2pi(radg + raddelta);
      radb = mod2pi(radb + raddelta);
    }, updateTime);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
