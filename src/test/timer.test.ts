import * as assert from 'assert';

import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers';
import { Timer } from '../timer';

suite('Timer', () => {
  let clock: InstalledClock;
  let a = 0;

  suiteSetup(() => {
    clock = FakeTimers.install({ shouldClearNativeTimers: true });
  });

  suiteTeardown(() => {
    Timer.resetInstance();
    clock.uninstall();
  });

  teardown(() => {
    Timer.resetInstance();

    a = 0;
  });

  test('.getInstance', () => {
    assert.strictEqual(Timer.getInstance(), Timer.getInstance());
  });

  test('#start', () => {
    const timer = Timer.getInstance();
    timer.start(() => {
      a += 42;
    }, 1000);
    clock.tick(1000);
    assert.strictEqual(a, 42);
  });

  test('#stop', () => {
    const timer = Timer.getInstance();
    timer.stop();
    clock.tick(1000);
    assert.strictEqual(a, 0);
  });

  test('#isRunning', () => {
    const timer = Timer.getInstance();
    timer.start(() => {}, 1000);
    assert.equal(timer.isRunning(), true);
    timer.stop();
    assert.equal(timer.isRunning(), false);
  });
});
