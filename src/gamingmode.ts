import * as vscode from 'vscode';

import { ColorWheel } from './colorwheel';
import type { Config } from './config';
import type { GamingState } from './gamingstate';
import { type ColorCustomizations, TargetColors, type TargetSnapshot } from './targetcolors';
import { Timer } from './timer';

const COLOR_CUSTOMIZATIONS = 'workbench.colorCustomizations';

// How long `restoreInterrupted` watches the targets before deciding that nobody is animating them.
// Long enough to catch an animation running at the default update time several times over.
const MIN_OBSERVATION_TIME = 1000;

// `WorkspaceConfiguration` is a snapshot rather than a live view, so it is re-read on every access
// to make sure customizations written after it was obtained are not dropped.
function getColorCustomizations(): ColorCustomizations | undefined {
  return vscode.workspace.getConfiguration().get<ColorCustomizations>(COLOR_CUSTOMIZATIONS);
}

function updateColorCustomizations(customizations: ColorCustomizations): Thenable<void> {
  // Writing an empty object would leave a `"workbench.colorCustomizations": {}` block behind in
  // settings.json. Passing undefined drops the entry instead.
  const value = Object.keys(customizations).length > 0 ? customizations : undefined;

  return vscode.workspace.getConfiguration().update(COLOR_CUSTOMIZATIONS, value, true);
}

// The colors the targets hold right now, in a form that is cheap to compare.
function readTargetColors(targets: string[]): string {
  const customizations = getColorCustomizations();

  return JSON.stringify(targets.map((target) => customizations?.[target] ?? null));
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// Gaming mode: the animation, and the values it has to put back when it ends.
export class GamingMode {
  private readonly state: GamingState;

  // The values the targets held before gaming mode overwrote them. Restoring puts back these
  // entries only, so customizations outside of `gaming.targets` are never touched.
  private originalTargets: TargetSnapshot;

  // The write started by the most recent tick. Nothing awaits a tick, so it is tracked here for a
  // restore to wait on, and its failure is reported here rather than left as an unhandled rejection.
  private pendingUpdate: Promise<void>;

  constructor(state: GamingState) {
    this.state = state;
    this.originalTargets = state.load();
    this.pendingUpdate = Promise.resolve();
  }

  public async start(config: Config): Promise<void> {
    const delta = config.delta();
    let shift = delta;

    const timer = Timer.getInstance();
    if (!timer.isRunning()) {
      await this.record(config.targets);
    }

    // `config.targets` is captured here instead of being re-read on every tick, so that the targets
    // the animation writes always match the ones recorded in `originalTargets`.
    timer.start(() => {
      const color = ColorWheel.at(shift);
      this.updateFromTick(TargetColors.apply(getColorCustomizations(), config.targets, color.code()));

      shift += delta;
    }, config.updateTime);
  }

  public stop(): void {
    Timer.getInstance().stop();
  }

  public async reset(): Promise<void> {
    Timer.getInstance().stop();
    await this.restore();
  }

  // Gaming mode writes its colors straight into the user settings, so anything still recorded when
  // the extension starts up means the previous session was interrupted before it could put them
  // back, and the settings are still holding gaming colors.
  //
  // What is recorded is shared by every window, though, so it is not proof that gaming mode is
  // over: another window may be animating right now. Watch the targets for long enough to see a
  // tick before deciding, and leave them alone if something is still changing them.
  public async restoreInterrupted(config: Config): Promise<void> {
    if (this.originalTargets.size === 0) {
      return;
    }

    const targets = Array.from(this.originalTargets.keys());
    const before = readTargetColors(targets);

    await delay(Math.max(MIN_OBSERVATION_TIME, config.updateTime * 2));

    // Gaming mode was started in this window while the targets were being watched
    if (Timer.getInstance().isRunning()) {
      return;
    }

    if (readTargetColors(targets) !== before) {
      return;
    }

    await this.restore();
  }

  private async record(targets: string[]): Promise<void> {
    const recorded = TargetColors.record(this.originalTargets, getColorCustomizations(), targets);

    // Recording never replaces what is already there, so a same-sized result covers the same
    // targets and there is nothing new to store
    if (recorded.size === this.originalTargets.size) {
      return;
    }

    this.originalTargets = recorded;
    await this.state.save(recorded);
  }

  private async restore(): Promise<void> {
    // Nothing was recorded, so there is nothing this extension is entitled to put back.
    if (this.originalTargets.size === 0) {
      return;
    }

    // Stopping the timer does not stop a tick that is already writing. Let it settle first,
    // otherwise it could land after the restore and put a gaming color back.
    await this.pendingUpdate;

    await updateColorCustomizations(TargetColors.restore(getColorCustomizations(), this.originalTargets));

    this.originalTargets = new Map();
    await this.state.clear();
  }

  private updateFromTick(customizations: ColorCustomizations): void {
    this.pendingUpdate = Promise.resolve(updateColorCustomizations(customizations)).then(undefined, (error) => {
      console.error('vscode-gaming: failed to update color customizations', error);
    });
  }
}
