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

    assert.deepEqual(state.load(), new Map());
  });

  test('round trips the recorded values', async () => {
    const memento = fakeMemento();
    const snapshot = new Map<string, unknown>([
      ['editor.background', '#123456'],
      ['panel.background', '#654321'],
    ]);

    await new GamingState(memento).save(snapshot);

    // A different instance, as after a restart
    assert.deepEqual(new GamingState(memento).load(), snapshot);
  });

  test('round trips a target that was absent', async () => {
    const memento = fakeMemento();
    const snapshot = new Map<string, unknown>([['editor.background', undefined]]);

    await new GamingState(memento).save(snapshot);
    const loaded = new GamingState(memento).load();

    // Absent has to survive as absent rather than as null, or the target would be restored to a
    // null value instead of being removed
    assert.deepEqual(loaded, snapshot);
    assert.equal(loaded.has('editor.background'), true);
    assert.equal(loaded.get('editor.background'), undefined);
  });

  test('round trips a theme scoped block', async () => {
    const memento = fakeMemento();
    const snapshot = new Map<string, unknown>([['[Default Dark+]', { 'editor.background': '#123456' }]]);

    await new GamingState(memento).save(snapshot);

    assert.deepEqual(new GamingState(memento).load(), snapshot);
  });

  test('loads nothing after clearing', async () => {
    const memento = fakeMemento();
    const state = new GamingState(memento);

    await state.save(new Map([['editor.background', '#123456']]));
    await state.clear();

    assert.deepEqual(new GamingState(memento).load(), new Map());
  });

  suite('when the stored value cannot be read back', () => {
    function stateHolding(value: unknown): GamingState {
      return new GamingState({
        get: () => value,
        update: () => Promise.resolve(),
        keys: () => [],
      } as unknown as vscode.Memento);
    }

    test('ignores a value that is not an array', () => {
      assert.deepEqual(stateHolding({ 'editor.background': '#123456' }).load(), new Map());
    });

    test('ignores entries without a target', () => {
      assert.deepEqual(stateHolding([{ original: '#123456' }, null, 'editor.background']).load(), new Map());
    });

    test('keeps the entries it can read', () => {
      const loaded = stateHolding([
        { target: 'editor.background', original: '#123456' },
        { original: '#654321' },
      ]).load();

      assert.deepEqual(loaded, new Map([['editor.background', '#123456']]));
    });
  });
});
