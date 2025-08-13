import * as assert from 'node:assert';
import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers';
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

    // Stub getConfiguration to return appropriate mock based on section
    configStub = sinon.stub(vscode.workspace, 'getConfiguration').callsFake((section?: string) => {
      if (section === 'gaming') {
        return mockGamingConfig;
      }

      return mockConfiguration;
    });
  });

  teardown(() => {
    // Reset timer instance to ensure clean state between tests
    Timer.resetInstance();

    // Restore all stubs
    configStub.restore();
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

    // Verify state after reset
    assert.equal(timer.isRunning(), false);
    assert.deepEqual(mockWorkbenchColorCustomizations, {});
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
