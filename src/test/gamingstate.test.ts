import * as assert from 'node:assert';
import type * as vscode from 'vscode';

import { GamingState } from '../gamingstate';

// A Memento that keeps values as JSON, the way the real one has to store them
function fakeMemento(): vscode.Memento {
  let stored: string | undefined;

  return {
    get: <T>(_key: string, defaultValue?: T) => (stored === undefined ? defaultValue : JSON.parse(stored)),
    update: (_key: string, value: unknown) => {
      stored = value === undefined ? undefined : JSON.stringify(value);

      return Promise.resolve();
    },
    keys: () => (stored === undefined ? [] : ['vscode-gaming.originalTargets']),
  } as vscode.Memento;
}

suite('GamingState', () => {
  test('loads nothing when nothing was saved', () => {
    const state = new GamingState(fakeMemento());

    assert.deepEqual(state.load(), { targets: new Map(), updateTime: 0 });
  });

  test('round trips the recorded values', async () => {
    const memento = fakeMemento();
    const snapshot = new Map<string, unknown>([
      ['editor.background', '#123456'],
      ['panel.background', '#654321'],
    ]);

    await new GamingState(memento).save({ targets: snapshot, updateTime: 50 });

    // A different instance, as after a restart
    assert.deepEqual(new GamingState(memento).load(), { targets: snapshot, updateTime: 50 });
  });

  test('round trips a target that was absent', async () => {
    const memento = fakeMemento();
    const snapshot = new Map<string, unknown>([['editor.background', undefined]]);

    await new GamingState(memento).save({ targets: snapshot, updateTime: 50 });
    const loaded = new GamingState(memento).load().targets;

    // Absent has to survive as absent rather than as null, or the target would be restored to a
    // null value instead of being removed
    assert.deepEqual(loaded, snapshot);
    assert.equal(loaded.has('editor.background'), true);
    assert.equal(loaded.get('editor.background'), undefined);
  });

  test('round trips a theme scoped block', async () => {
    const memento = fakeMemento();
    const snapshot = new Map<string, unknown>([['[Default Dark+]', { 'editor.background': '#123456' }]]);

    await new GamingState(memento).save({ targets: snapshot, updateTime: 50 });

    assert.deepEqual(new GamingState(memento).load().targets, snapshot);
  });

  test('loads nothing after clearing', async () => {
    const memento = fakeMemento();
    const state = new GamingState(memento);

    await state.save({ targets: new Map([['editor.background', '#123456']]), updateTime: 50 });
    await state.clear();

    assert.deepEqual(new GamingState(memento).load(), { targets: new Map(), updateTime: 0 });
  });

  suite('when the stored value cannot be read back', () => {
    function stateHolding(value: unknown): GamingState {
      return new GamingState({
        get: () => value,
        update: () => Promise.resolve(),
        keys: () => [],
      } as unknown as vscode.Memento);
    }

    test('ignores a value of the wrong shape', () => {
      assert.deepEqual(stateHolding({ 'editor.background': '#123456' }).load(), {
        targets: new Map(),
        updateTime: 0,
      });
    });

    test('ignores a record without an update time', () => {
      const stored = { targets: [{ target: 'editor.background', original: '#123456' }] };

      assert.deepEqual(stateHolding(stored).load(), { targets: new Map(), updateTime: 0 });
    });

    test('keeps the entries it can read', () => {
      const stored = {
        targets: [{ target: 'editor.background', original: '#123456' }, { original: '#654321' }, null],
        updateTime: 50,
      };

      assert.deepEqual(stateHolding(stored).load(), {
        targets: new Map([['editor.background', '#123456']]),
        updateTime: 50,
      });
    });
  });
});
