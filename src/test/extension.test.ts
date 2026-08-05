import * as assert from 'node:assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

import { Timer } from '../timer';

// What each command does is covered by the GamingMode tests. These check that the commands are
// registered and wired to it, against the real extension host, so they run on real timers: the
// commands write to the real globalState, which fake timers would keep from ever settling.
suite('Commands', () => {
  let configStub: sinon.SinonStub;
  let customizations: Record<string, unknown> | undefined;

  const UPDATE_TIME = 20;

  function waitForTick(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, UPDATE_TIME * 3));
  }

  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension('omi.vscode-gaming');
    if (!ext) {
      throw new Error('failed to get extension');
    }

    await ext.activate();

    // Activation kicks off a restore of whatever a previous run left in the real globalState,
    // which would otherwise land in the middle of a test a second or so later. Clear it, and wait
    // long enough for that restore to have given up on what it was watching.
    await vscode.commands.executeCommand('vscode-gaming.reset');
    await new Promise((resolve) => setTimeout(resolve, 1500));
  });

  setup(() => {
    customizations = { 'panel.background': '#123456' };

    const workbenchConfiguration = {
      get: (key: string) => (key === 'workbench.colorCustomizations' ? customizations : undefined),
      update: (key: string, value: Record<string, unknown> | undefined) => {
        if (key === 'workbench.colorCustomizations') {
          customizations = value;
        }

        return Promise.resolve();
      },
      has: () => true,
      inspect: () => ({}),
    } as unknown as vscode.WorkspaceConfiguration;

    configStub = sinon.stub(vscode.workspace, 'getConfiguration').callsFake((section?: string) => {
      if (section === 'gaming') {
        return {
          period: 10000,
          updateTime: UPDATE_TIME,
          targets: ['editor.background'],
        } as unknown as vscode.WorkspaceConfiguration;
      }

      return workbenchConfiguration;
    });
  });

  teardown(async () => {
    try {
      // Drop what the extension recorded, so that tests do not depend on whether the preceding one
      // happened to end with a reset. Runs while the configuration is still stubbed, to keep it
      // away from the real settings.
      await vscode.commands.executeCommand('vscode-gaming.reset');
    } finally {
      // Restore even if the reset above failed, so that one broken test does not leave every
      // later one failing on an already wrapped getConfiguration
      Timer.resetInstance();
      configStub.restore();
    }
  });

  test('vscode-gaming.start', async () => {
    await vscode.commands.executeCommand('vscode-gaming.start');
    await waitForTick();

    assert.equal(Timer.getInstance().isRunning(), true);
    assert.ok(customizations?.['editor.background']);
    assert.equal(customizations?.['panel.background'], '#123456');
  });

  test('vscode-gaming.stop', async () => {
    await vscode.commands.executeCommand('vscode-gaming.start');
    await vscode.commands.executeCommand('vscode-gaming.stop');

    assert.equal(Timer.getInstance().isRunning(), false);
  });

  test('vscode-gaming.reset', async () => {
    await vscode.commands.executeCommand('vscode-gaming.start');
    await waitForTick();
    await vscode.commands.executeCommand('vscode-gaming.reset');

    assert.equal(Timer.getInstance().isRunning(), false);
    assert.deepEqual(customizations, { 'panel.background': '#123456' });
  });
});
