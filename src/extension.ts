import * as vscode from 'vscode';

import { ColorWheel } from './colorwheel';
import { Config } from './config';
import { type ColorCustomizations, TargetColors, type TargetSnapshot } from './targetcolors';
import { Timer } from './timer';

const COLOR_CUSTOMIZATIONS = 'workbench.colorCustomizations';

// `WorkspaceConfiguration` is a snapshot rather than a live view, so it is re-read on every access
// to make sure customizations written after it was obtained are not dropped.
function getColorCustomizations(): ColorCustomizations | undefined {
  return vscode.workspace.getConfiguration().get<ColorCustomizations>(COLOR_CUSTOMIZATIONS);
}

function updateColorCustomizations(customizations: ColorCustomizations): Thenable<void> {
  return vscode.workspace.getConfiguration().update(COLOR_CUSTOMIZATIONS, customizations, true);
}

export function activate(context: vscode.ExtensionContext) {
  // The values the targets held before gaming mode overwrote them. Reset puts back these entries
  // only, so customizations outside of `gaming.targets` are never touched.
  let originalTargets: TargetSnapshot = new Map();

  const startCmd = vscode.commands.registerCommand('vscode-gaming.start', () => {
    const config = new Config();

    const delta = config.delta();
    let shift = delta;

    const timer = Timer.getInstance();
    if (!timer.isRunning()) {
      originalTargets = TargetColors.snapshot(getColorCustomizations(), config.targets);
    }

    // `config.targets` is captured here instead of being re-read on every tick, so that the targets
    // the animation writes always match the ones recorded in `originalTargets`.
    timer.start(() => {
      const color = ColorWheel.at(shift);
      updateColorCustomizations(TargetColors.apply(getColorCustomizations(), config.targets, color.code()));

      shift += delta;
    }, config.updateTime);
  });

  const stopCmd = vscode.commands.registerCommand('vscode-gaming.stop', () => {
    const timer = Timer.getInstance();
    timer.stop();
  });

  const resetCmd = vscode.commands.registerCommand('vscode-gaming.reset', async () => {
    const timer = Timer.getInstance();
    timer.stop();

    // Nothing was recorded, so there is nothing this extension is entitled to put back.
    if (originalTargets.size === 0) {
      return;
    }

    await updateColorCustomizations(TargetColors.restore(getColorCustomizations(), originalTargets));
    originalTargets = new Map();
  });

  context.subscriptions.push(startCmd);
  context.subscriptions.push(stopCmd);
  context.subscriptions.push(resetCmd);
}

export function deactivate() {
  const timer = Timer.getInstance();
  timer.stop();
}
