import * as assert from 'node:assert';
import type { Clock } from '@sinonjs/fake-timers';
import * as FakeTimers from '@sinonjs/fake-timers';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

import { Config } from '../config';
import { GamingMode } from '../gamingmode';
import { GamingState } from '../gamingstate';
import { Timer } from '../timer';

// How long restoreInterrupted watches the targets at the default update time
const OBSERVATION_TIME = 1000;

suite('GamingMode', () => {
  let clock: Clock;
  let configStub: sinon.SinonStub;

  // Mock workbench.colorCustomizations storage, and how a write to it lands. Tests that care about
  // a write still being in flight replace `land` with something that settles on demand.
  let customizations: Record<string, unknown> | undefined;
  let land: (value: Record<string, unknown> | undefined) => Promise<void>;

  // Mock gaming configuration, rebuilt on every read so that a test can change it
  let updateTime: number;
  let targets: string[];

  // Mock globalState storage, kept as JSON the way the real Memento has to store it
  let stored: string | undefined;
  let memento: vscode.Memento;

  function newGamingMode(): GamingMode {
    return new GamingMode(new GamingState(memento));
  }

  function savedTargets(): Map<string, unknown> {
    return new GamingState(memento).load().targets;
  }

  // Advances past the window restoreInterrupted watches the targets for
  async function observe(): Promise<void> {
    await clock.tickAsync(OBSERVATION_TIME);
  }

  suiteSetup(() => {
    clock = FakeTimers.install({ shouldClearNativeTimers: true });
  });

  suiteTeardown(() => {
    Timer.resetInstance();
    clock.uninstall();
  });

  setup(() => {
    customizations = {};
    land = (value) => {
      customizations = value;

      return Promise.resolve();
    };
    updateTime = 50;
    targets = ['editor.background'];
    stored = undefined;

    memento = {
      get: <T>(_key: string, defaultValue?: T) => (stored === undefined ? defaultValue : JSON.parse(stored)),
      update: (_key: string, value: unknown) => {
        stored = value === undefined ? undefined : JSON.stringify(value);

        return Promise.resolve();
      },
      keys: () => [],
    } as vscode.Memento;

    const workbenchConfiguration = {
      get: (key: string) => (key === 'workbench.colorCustomizations' ? customizations : undefined),
      update: (key: string, value: Record<string, unknown> | undefined) => {
        if (key === 'workbench.colorCustomizations') {
          return land(value);
        }

        return Promise.resolve();
      },
      has: () => true,
      inspect: () => ({}),
    } as unknown as vscode.WorkspaceConfiguration;

    configStub = sinon.stub(vscode.workspace, 'getConfiguration').callsFake((section?: string) => {
      if (section === 'gaming') {
        const gaming: Record<string, unknown> = { period: 10000, updateTime, targets };

        return {
          get: <T>(key: string, defaultValue?: T) => (gaming[key] as T | undefined) ?? defaultValue,
          update: () => Promise.resolve(),
          has: (key: string) => key in gaming,
          inspect: () => ({}),
        } as unknown as vscode.WorkspaceConfiguration;
      }

      return workbenchConfiguration;
    });
  });

  teardown(() => {
    Timer.resetInstance();
    configStub.restore();
  });

  suite('#start', () => {
    test('records the values the targets held', async () => {
      customizations = { 'editor.background': '#123456', 'panel.background': '#654321' };

      await newGamingMode().start(new Config());

      assert.deepEqual(savedTargets(), new Map([['editor.background', '#123456']]));
    });

    test('records a target that was absent', async () => {
      await newGamingMode().start(new Config());

      assert.deepEqual(savedTargets(), new Map([['editor.background', undefined]]));
    });

    test('keeps what was recorded when gaming mode is restarted', async () => {
      const mode = newGamingMode();
      customizations = { 'editor.background': '#123456' };

      await mode.start(new Config());
      await clock.tickAsync(updateTime);
      mode.stop();

      // The customizations now hold a gaming color, which must not be mistaken for the original
      assert.notEqual(customizations?.['editor.background'], '#123456');
      await mode.start(new Config());

      assert.deepEqual(savedTargets(), new Map([['editor.background', '#123456']]));

      await mode.reset();
      assert.deepEqual(customizations, { 'editor.background': '#123456' });
    });

    test('keeps what another window recorded', async () => {
      customizations = { 'editor.background': '#123456' };

      // Two windows sharing the same globalState, both started up before gaming mode was ever
      // used, so neither has anything recorded to begin with
      const other = newGamingMode();
      const mode = newGamingMode();

      await other.start(new Config());
      await clock.tickAsync(updateTime);
      Timer.resetInstance();

      // This window sees the gaming color, which must not be mistaken for the original
      assert.notEqual(customizations?.['editor.background'], '#123456');
      await mode.start(new Config());

      assert.deepEqual(savedTargets(), new Map([['editor.background', '#123456']]));

      await mode.reset();
      assert.deepEqual(customizations, { 'editor.background': '#123456' });
    });

    test('keeps the slowest update time of the windows sharing the record', async () => {
      // A window animating slowly, and a faster one that has not started gaming mode yet
      updateTime = 2000;
      const slow = newGamingMode();
      const fast = newGamingMode();

      await slow.start(new Config());
      await clock.tickAsync(updateTime);
      Timer.resetInstance();

      updateTime = 50;
      await fast.start(new Config());

      // Whoever watches these colors still has to allow for the slow animation
      assert.equal(new GamingState(memento).load().updateTime, 2000);
    });

    test('records a target added to the configuration while stopped', async () => {
      const mode = newGamingMode();
      customizations = { 'editor.background': '#123456', 'panel.background': '#654321' };

      await mode.start(new Config());
      await clock.tickAsync(updateTime);
      mode.stop();

      targets = ['editor.background', 'panel.background'];
      await mode.start(new Config());

      assert.deepEqual(
        savedTargets(),
        new Map([
          ['editor.background', '#123456'],
          ['panel.background', '#654321'],
        ]),
      );
    });
  });

  suite('#reset', () => {
    test('clears what was recorded', async () => {
      const mode = newGamingMode();

      await mode.start(new Config());
      await clock.tickAsync(updateTime);
      await mode.reset();

      assert.deepEqual(savedTargets(), new Map());
      assert.equal(customizations, undefined);
    });

    test('waits for the write started by the animation', async () => {
      const mode = newGamingMode();
      await mode.start(new Config());

      // Hold the write the next tick starts, so that it is still in flight once reset runs
      let writes = 0;
      let landAnimationWrite: (() => void) | undefined;
      land = (value) => {
        writes += 1;
        if (writes > 1) {
          customizations = value;

          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          landAnimationWrite = () => {
            customizations = value;
            resolve();
          };
        });
      };

      await clock.tickAsync(updateTime);
      assert.equal(writes, 1);

      const resetting = mode.reset();
      await clock.tickAsync(0);

      // Reset has not written anything on top of the in-flight write yet
      assert.equal(writes, 1);

      landAnimationWrite?.();
      await resetting;

      // The restore is the write that lands last
      assert.equal(writes, 2);
      assert.equal(customizations, undefined);
    });

    test('keeps what was recorded when gaming mode starts while the restore is being written', async () => {
      const mode = newGamingMode();
      customizations = { 'editor.background': '#123456' };

      await mode.start(new Config());
      await clock.tickAsync(updateTime);

      // Hold the restore open, so that gaming mode can start while it is being written
      let landRestore: (() => void) | undefined;
      land = (value) => {
        return new Promise<void>((resolve) => {
          landRestore = () => {
            customizations = value;
            resolve();
          };
        });
      };

      const resetting = mode.reset();
      await clock.tickAsync(0);

      land = (value) => {
        customizations = value;

        return Promise.resolve();
      };
      await mode.start(new Config());

      landRestore?.();
      await resetting;

      // The animation is running again, so the values it has to put back are still needed
      assert.deepEqual(savedTargets(), new Map([['editor.background', '#123456']]));

      await mode.reset();
      assert.deepEqual(customizations, { 'editor.background': '#123456' });
    });
  });

  suite('#restoreInterrupted', () => {
    // Gaming mode running in a window that goes away without resetting
    async function interrupt(): Promise<void> {
      const mode = newGamingMode();
      await mode.start(new Config());
      await clock.tickAsync(updateTime);
      Timer.resetInstance();
    }

    test('puts back the colors an interrupted session left behind', async () => {
      customizations = { 'editor.background': '#123456', 'panel.background': '#654321' };
      await interrupt();

      assert.notEqual(customizations?.['editor.background'], '#123456');

      // A new extension host, with only what was persisted to go on
      const restoring = newGamingMode().restoreInterrupted();
      await observe();
      await restoring;

      assert.deepEqual(customizations, { 'editor.background': '#123456', 'panel.background': '#654321' });
      assert.deepEqual(savedTargets(), new Map());
    });

    test('removes a target the interrupted session had added', async () => {
      customizations = { 'panel.background': '#654321' };
      await interrupt();

      const restoring = newGamingMode().restoreInterrupted();
      await observe();
      await restoring;

      assert.deepEqual(customizations, { 'panel.background': '#654321' });
    });

    test('does nothing when nothing was recorded', async () => {
      customizations = { 'editor.background': '#123456' };

      await newGamingMode().restoreInterrupted();

      assert.deepEqual(customizations, { 'editor.background': '#123456' });
    });

    test('leaves the colors alone while another window is animating', async () => {
      customizations = { 'editor.background': '#123456' };
      await interrupt();

      const restoring = newGamingMode().restoreInterrupted();

      // The other window keeps writing while the targets are being watched
      customizations = { ...customizations, 'editor.background': '#abcdef' };
      await observe();
      await restoring;

      assert.deepEqual(customizations, { 'editor.background': '#abcdef' });

      // What was recorded is still there for whoever ends up resetting
      assert.deepEqual(savedTargets(), new Map([['editor.background', '#123456']]));
    });

    test('watches for as long as the animation that recorded the colors needs', async () => {
      // The window that was interrupted was animating far more slowly than this one is configured
      // to, so watching for this window's update time would not see a single tick of it
      updateTime = 2000;
      customizations = { 'editor.background': '#123456' };
      await interrupt();

      updateTime = 50;
      const restoring = newGamingMode().restoreInterrupted();

      await clock.tickAsync(OBSERVATION_TIME);

      // A tick of the slow animation, after this window's own update time would have run out
      customizations = { ...customizations, 'editor.background': '#abcdef' };
      await clock.tickAsync(3 * OBSERVATION_TIME);
      await restoring;

      assert.deepEqual(customizations, { 'editor.background': '#abcdef' });
      assert.deepEqual(savedTargets(), new Map([['editor.background', '#123456']]));
    });

    test('leaves the colors alone when gaming mode starts in this window', async () => {
      customizations = { 'editor.background': '#123456' };
      await interrupt();

      const mode = newGamingMode();
      const restoring = mode.restoreInterrupted();
      await mode.start(new Config());
      await observe();
      await restoring;

      assert.notEqual(customizations?.['editor.background'], '#123456');
      assert.deepEqual(savedTargets(), new Map([['editor.background', '#123456']]));
    });
  });
});
