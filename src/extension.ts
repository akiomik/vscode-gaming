import * as vscode from 'vscode';

import { ColorWheel } from './colorwheel';
import { Config } from './config';
import { Timer } from './timer';

export function activate(context: vscode.ExtensionContext) {
  let originalCustomizations = vscode.workspace.getConfiguration().get('workbench.colorCustomizations');

  const startCmd = vscode.commands.registerCommand('vscode-gaming.start', () => {
    const globalConfig = vscode.workspace.getConfiguration();
    const config = new Config();

    const delta = config.delta();
    let shift = delta;

    const timer = Timer.getInstance();
    if (!timer.isRunning()) {
      originalCustomizations = globalConfig.get('workbench.colorCustomizations');
    }

    timer.start(() => {
      const color = ColorWheel.at(shift);
      const entries = config.targets.map((target) => [target, color.code()]);
      const customizations = Object.fromEntries(entries);
      globalConfig.update('workbench.colorCustomizations', customizations, true);

      shift += delta;
    }, config.updateTime);
  });

  const stopCmd = vscode.commands.registerCommand('vscode-gaming.stop', () => {
    const timer = Timer.getInstance();
    timer.stop();
  });

  const resetCmd = vscode.commands.registerCommand('vscode-gaming.reset', () => {
    const timer = Timer.getInstance();
    timer.stop();

    const globalConfig = vscode.workspace.getConfiguration();
    globalConfig.update('workbench.colorCustomizations', originalCustomizations, true);
  });

  context.subscriptions.push(startCmd);
  context.subscriptions.push(stopCmd);
  context.subscriptions.push(resetCmd);
}

export function deactivate() {
  const timer = Timer.getInstance();
  timer.stop();
}
