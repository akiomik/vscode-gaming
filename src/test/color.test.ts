import * as assert from 'node:assert';

import { Color } from '../color';

suite('Color', () => {
  test('constructor', () => {
    assert.deepEqual(new Color(33.3, 66.6, 99.9), new Color(33, 67, 100));
    assert.throws(() => new Color(-1, 0, 0));
    assert.throws(() => new Color(0, -1, 0));
    assert.throws(() => new Color(0, 0, -1));
    assert.throws(() => new Color(256, 0, 0));
    assert.throws(() => new Color(0, 256, 0));
    assert.throws(() => new Color(0, 0, 256));
    assert.doesNotThrow(() => new Color(0, 0, 0));
    assert.doesNotThrow(() => new Color(255, 255, 255));
  });

  test('#code', () => {
    assert.strictEqual(new Color(0, 0, 0).code(), '#000000');
    assert.strictEqual(new Color(127.5, 127.5, 127.5).code(), '#808080');
    assert.strictEqual(new Color(255, 255, 255).code(), '#ffffff');
  });
});
