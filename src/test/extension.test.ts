import * as assert from 'node:assert';
import type { InstalledClock } from '@sinonjs/fake-timers';
import * as FakeTimers from '@sinonjs/fake-timers';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

import { Timer } from '../timer';

suite('Commands', () => {
  let clock: InstalledClock;
  let configStub: sinon.SinonStub;

  // Mock configuration
  let mockWorkbenchColorCustomizations: Record<string, string>;
  const mockConfiguration: vscode.WorkspaceConfiguration = {
    get: sinon.stub().callsFake((key: string) => {
      if (key === 'workbench.colorCustomizations') {
        return mockWorkbenchColorCustomizations;
      }

      return undefined;
    }),
    update: sinon.stub().callsFake((key: string, value: Record<string, string>) => {
      if (key === 'workbench.colorCustomizations') {
        mockWorkbenchColorCustomizations = value;
      }

      return Promise.resolve();
    }),
    has: sinon.stub().returns(true),
    inspect: sinon.stub().returns({}),
  };

  // Mock gaming configuration with default values
  const mockGamingConfig: vscode.WorkspaceConfiguration = {
    period: 10000,
    updateTime: 50,
    targets: ['editor.background'],
    has: sinon.stub().returns(true),
    inspect: sinon.stub().returns({}),
    get: sinon.stub().callsFake((key: string) => {
      if (key === 'period') return 10000;
      if (key === 'updateTime') return 50;
      if (key === 'targets') return ['editor.background'];

      return undefined;
    }),
    update: sinon.stub().returns(Promise.resolve()),
  };

  // Stub getConfiguration to return the appropriate mock based on section
  function stubGetConfiguration(configuration: vscode.WorkspaceConfiguration): sinon.SinonStub {
    return sinon.stub(vscode.workspace, 'getConfiguration').callsFake((section?: string) => {
      if (section === 'gaming') {
        return mockGamingConfig;
      }

      return configuration;
    });
  }

  suiteSetup(async () => {
    clock = FakeTimers.install({ shouldClearNativeTimers: true });

    const ext = vscode.extensions.getExtension('omi.vscode-gaming');
    if (!ext) {
      throw new Error('failed to get extension');
    }

    await ext.activate();
  });

  suiteTeardown(() => {
    Timer.resetInstance();
    clock.uninstall();
  });

  setup(() => {
    // Mock workbench.colorCustomizations storage
    mockWorkbenchColorCustomizations = {};

    configStub = stubGetConfiguration(mockConfiguration);
  });

  teardown(async () => {
    try {
      // Drop the snapshot the extension holds between commands, so that tests do not depend on
      // whether the preceding one happened to end with a reset. Runs while the configuration is
      // still stubbed, to keep it away from the real settings.
      await vscode.commands.executeCommand('vscode-gaming.reset');
    } finally {
      // Restore even if the reset above failed, so that one broken test does not leave every
      // later one failing on an already wrapped getConfiguration

      // Reset timer instance to ensure clean state between tests
      Timer.resetInstance();

      // Restore all stubs
      configStub.restore();
    }
  });

  test('vscode-gaming.start', async () => {
    const timer = Timer.getInstance();

    // Initial state
    assert.deepEqual(mockWorkbenchColorCustomizations, {});
    assert.equal(timer.isRunning(), false);

    // Execute start command
    await vscode.commands.executeCommand('vscode-gaming.start');
    clock.tick(50);

    // Verify state after start
    assert.equal(timer.isRunning(), true);
    assert.notDeepEqual(mockWorkbenchColorCustomizations, {});
    assert.ok(mockWorkbenchColorCustomizations['editor.background']);
  });

  test('vscode-gaming.stop', async () => {
    const timer = Timer.getInstance();

    // Start gaming mode first
    await vscode.commands.executeCommand('vscode-gaming.start');
    assert.equal(timer.isRunning(), true);

    // Execute stop command
    await vscode.commands.executeCommand('vscode-gaming.stop');

    // Verify timer is stopped
    assert.equal(timer.isRunning(), false);
  });

  test('vscode-gaming.reset', async () => {
    const timer = Timer.getInstance();

    // Start gaming mode first
    await vscode.commands.executeCommand('vscode-gaming.start');
    clock.tick(50);

    assert.equal(timer.isRunning(), true);
    assert.notDeepEqual(mockWorkbenchColorCustomizations, {});

    // Execute reset command
    await vscode.commands.executeCommand('vscode-gaming.reset');

    // Verify state after reset. There was nothing to customize to begin with, so the setting is
    // dropped rather than left behind as an empty block
    assert.equal(timer.isRunning(), false);
    assert.equal(mockWorkbenchColorCustomizations, undefined);
  });

  test('vscode-gaming.reset waits for the write started by the animation', async () => {
    let updateCount = 0;
    let landAnimationUpdate: (() => void) | undefined;

    // Swap in a configuration that holds the first write open, so that the write started by the
    // animation is still in flight once reset runs
    const heldConfiguration: vscode.WorkspaceConfiguration = {
      ...mockConfiguration,
      update: sinon.stub().callsFake((key: string, value: Record<string, string>) => {
        updateCount += 1;
        const land = () => {
          if (key === 'workbench.colorCustomizations') {
            mockWorkbenchColorCustomizations = value;
          }
        };

        if (updateCount > 1) {
          land();
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          landAnimationUpdate = () => {
            land();
            resolve();
          };
        });
      }),
    };

    configStub.restore();
    configStub = stubGetConfiguration(heldConfiguration);

    try {
      await vscode.commands.executeCommand('vscode-gaming.start');
      clock.tick(50);

      assert.equal(updateCount, 1);

      const reset = vscode.commands.executeCommand('vscode-gaming.reset');
      await Promise.resolve();

      // Reset has not written anything on top of the in-flight write yet
      assert.equal(updateCount, 1);

      landAnimationUpdate?.();
      await reset;

      // The restore is the write that lands last
      assert.equal(updateCount, 2);
      assert.equal(mockWorkbenchColorCustomizations, undefined);
    } finally {
      // Never leave the held write pending, or teardown would wait on it forever
      landAnimationUpdate?.();
    }
  });

  test('vscode-gaming.start keeps customizations that are not targets', async () => {
    // Set initial customizations
    mockWorkbenchColorCustomizations = { 'panel.background': '#123456', 'statusBar.background': '#654321' };

    // Start gaming mode
    await vscode.commands.executeCommand('vscode-gaming.start');
    clock.tick(50);

    // Only the target is overwritten, while gaming mode is still running
    assert.ok(mockWorkbenchColorCustomizations['editor.background']);
    assert.equal(mockWorkbenchColorCustomizations['panel.background'], '#123456');
    assert.equal(mockWorkbenchColorCustomizations['statusBar.background'], '#654321');
  });

  test('vscode-gaming.reset restores the previous value of a target', async () => {
    // Set initial customizations
    const originalCustomizations = { 'editor.background': '#123456' };
    mockWorkbenchColorCustomizations = originalCustomizations;

    // Start gaming mode
    await vscode.commands.executeCommand('vscode-gaming.start');
    clock.tick(50);

    assert.notEqual(mockWorkbenchColorCustomizations['editor.background'], '#123456');

    // Reset should restore the value the target had before
    await vscode.commands.executeCommand('vscode-gaming.reset');

    assert.deepEqual(mockWorkbenchColorCustomizations, originalCustomizations);
  });

  test('vscode-gaming.reset keeps customizations changed while gaming mode was running', async () => {
    // Start gaming mode
    await vscode.commands.executeCommand('vscode-gaming.start');
    clock.tick(50);

    // The user edits an unrelated customization while gaming mode is running
    mockWorkbenchColorCustomizations = { ...mockWorkbenchColorCustomizations, 'panel.background': '#123456' };

    // Reset should leave that edit alone
    await vscode.commands.executeCommand('vscode-gaming.reset');

    assert.deepEqual(mockWorkbenchColorCustomizations, { 'panel.background': '#123456' });
  });

  test('vscode-gaming.reset without gaming mode leaves customizations alone', async () => {
    // Set initial customizations, including one that happens to be a target
    const originalCustomizations = { 'editor.background': '#123456', 'panel.background': '#654321' };
    mockWorkbenchColorCustomizations = originalCustomizations;

    // Reset without ever having started gaming mode
    await vscode.commands.executeCommand('vscode-gaming.reset');

    assert.deepEqual(mockWorkbenchColorCustomizations, originalCustomizations);
  });

  test('vscode-gaming.start preserves original customizations', async () => {
    // Set initial customizations
    const originalCustomizations = { 'panel.background': '#123456' };
    mockWorkbenchColorCustomizations = originalCustomizations;

    // Start gaming mode
    await vscode.commands.executeCommand('vscode-gaming.start');
    clock.tick(50);

    // Reset should restore original customizations
    await vscode.commands.executeCommand('vscode-gaming.reset');

    assert.deepEqual(mockWorkbenchColorCustomizations, originalCustomizations);
  });
});
