import * as vscode from 'vscode';

import { Config } from './config';
import { GamingMode } from './gamingmode';
import { GamingState } from './gamingstate';
import { Timer } from './timer';

export function activate(context: vscode.ExtensionContext) {
  const gaming = new GamingMode(new GamingState(context.globalState));

  // Runs on every startup, thanks to the `onStartupFinished` activation event, and does nothing
  // unless the previous session left gaming colors behind. Not awaited: it watches the colors for
  // a moment before deciding, and the commands have to be usable meanwhile.
  gaming.restoreInterrupted(new Config()).catch((error) => {
    console.error('vscode-gaming: failed to restore the colors of an interrupted session', error);
  });

  const startCmd = vscode.commands.registerCommand('vscode-gaming.start', () => gaming.start(new Config()));
  const stopCmd = vscode.commands.registerCommand('vscode-gaming.stop', () => gaming.stop());
  const resetCmd = vscode.commands.registerCommand('vscode-gaming.reset', () => gaming.reset());

  context.subscriptions.push(startCmd);
  context.subscriptions.push(stopCmd);
  context.subscriptions.push(resetCmd);
}

export function deactivate() {
  // The colors stay in the settings: a configuration update is not guaranteed to be written during
  // shutdown, so putting them back is left to `restoreInterrupted` on the next activation.
  const timer = Timer.getInstance();
  timer.stop();
}
