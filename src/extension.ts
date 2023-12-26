import * as vscode from 'vscode';

import { ColorWheel } from './colorwheel';
import { Timer } from './timer';

export function activate(context: vscode.ExtensionContext) {
  const startCmd = vscode.commands.registerCommand('vscode-gaming.start', () => {
    const config = vscode.workspace.getConfiguration();
    const gamingConfig = vscode.workspace.getConfiguration('gaming');
    const period: number = gamingConfig.period;
    const updateTime: number = gamingConfig.updateTime;
    const targets: string[] = gamingConfig.targets;

    const delta = (2.0 * Math.PI) / (period / updateTime);
    let shift = delta;

    const timer = Timer.getInstance();
    timer.start(() => {
      const color = ColorWheel.at(shift);
      const customizations = Object.fromEntries(targets.map((target) => [target, color.code()]));
      config.update('workbench.colorCustomizations', customizations, true);

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

export function deactivate() {}
