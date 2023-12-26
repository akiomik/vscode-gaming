import * as assert from 'assert';
import { setTimeout } from 'node:timers/promises';
import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers';
import * as vscode from 'vscode';

import { Timer } from '../timer';

suite('Commands', () => {
  let clock: InstalledClock;

  suiteSetup(async () => {
    clock = FakeTimers.install();

    const ext = vscode.extensions.getExtension('omi.vscode-gaming');
    if (!ext) {
      throw new Error('failed to get extension');
    }

    await ext.activate();
  });

  suiteTeardown(() => {
    clock.uninstall();
  });

  test('vscode-gaming.start', async () => {
    let config = vscode.workspace.getConfiguration();
    const timer = Timer.getInstance();
    assert.deepEqual(config.get('workbench.colorCustomizations'), {});
    assert.equal(timer.isRunning(), false);

    await vscode.commands.executeCommand('vscode-gaming.start');
    clock.tick(50);
    await setTimeout(1000);

    config = vscode.workspace.getConfiguration();
    assert.equal(timer.isRunning(), true);
    assert.notDeepEqual(config.get('workbench.colorCustomizations'), {});
  });

  test('vscode-gaming.stop', async () => {
    const timer = Timer.getInstance();
    assert.equal(timer.isRunning(), true);

    await vscode.commands.executeCommand('vscode-gaming.stop');

    assert.equal(timer.isRunning(), false);
  });

  test('vscode-gaming.reset', async () => {
    let config = vscode.workspace.getConfiguration();
    const timer = Timer.getInstance();
    assert.notDeepEqual(config.get('workbench.colorCustomizations'), {});

    await vscode.commands.executeCommand('vscode-gaming.reset');
    await setTimeout(1000);

    config = vscode.workspace.getConfiguration();
    assert.equal(timer.isRunning(), false);
    assert.deepEqual(config.get('workbench.colorCustomizations'), {});
  });
});
