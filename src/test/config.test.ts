import * as assert from 'node:assert';

import { Config } from '../config';

suite('Config', () => {
  // Read against the real configuration, with nothing set: what comes back is what package.json
  // contributes. `Config` repeats those defaults as the fallbacks of its `get` calls, so this
  // fails if the two ever drift apart.
  test('reads the defaults contributed in package.json', () => {
    const config = new Config();

    assert.equal(config.period, 10000);
    assert.equal(config.updateTime, 50);
    assert.deepEqual(config.targets, ['editor.background']);
  });

  test('#delta', () => {
    const config = new Config();
    assert.equal(config.delta(), 0.031415926535897934);
  });
});
