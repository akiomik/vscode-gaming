import * as assert from 'assert';

import { Color } from '../color';
import { ColorWheel } from '../colorwheel';

suite('ColorWheel', () => {
  test('at(0)', () => {
    assert.deepEqual(ColorWheel.at(0), new Color(128, 238, 128));
    assert.deepEqual(ColorWheel.at(0), ColorWheel.at(2 * Math.PI));
    assert.deepEqual(ColorWheel.at(0), ColorWheel.at(4 * Math.PI));
  });

  test('at(0.5 * Math.PI)', () => {
    assert.deepEqual(ColorWheel.at(0.5 * Math.PI), new Color(255, 64, 0));
    assert.deepEqual(ColorWheel.at(0.5 * Math.PI), ColorWheel.at(2.5 * Math.PI));
    assert.deepEqual(ColorWheel.at(0.5 * Math.PI), ColorWheel.at(4.5 * Math.PI));
  });

  test('at(Math.PI)', () => {
    assert.deepEqual(ColorWheel.at(Math.PI), new Color(128, 17, 128));
    assert.deepEqual(ColorWheel.at(Math.PI), ColorWheel.at(3 * Math.PI));
    assert.deepEqual(ColorWheel.at(Math.PI), ColorWheel.at(5 * Math.PI));
  });

  test('at(1.5 * Math.PI)', () => {
    assert.deepEqual(ColorWheel.at(1.5 * Math.PI), new Color(0, 191, 255));
    assert.deepEqual(ColorWheel.at(1.5 * Math.PI), ColorWheel.at(3.5 * Math.PI));
    assert.deepEqual(ColorWheel.at(1.5 * Math.PI), ColorWheel.at(5.5 * Math.PI));
  });
});
