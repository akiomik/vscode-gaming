import * as assert from 'node:assert';

import { Config } from '../config';

suite('Config', () => {
  test('#delta', () => {
    const config = new Config();
    assert.equal(config.delta(), 0.031415926535897934);
  });
});
