import * as assert from 'node:assert';

import { TargetColors } from '../targetcolors';

suite('TargetColors', () => {
  suite('.apply', () => {
    test('sets every target to the given color', () => {
      const customizations = { 'editor.background': '#000000' };
      const applied = TargetColors.apply(customizations, ['editor.background', 'sideBar.background'], '#ff0000');

      assert.deepEqual(applied, { 'editor.background': '#ff0000', 'sideBar.background': '#ff0000' });
    });

    test('keeps entries that are not targets', () => {
      const customizations = { 'panel.background': '#123456', 'statusBar.background': '#654321' };
      const applied = TargetColors.apply(customizations, ['editor.background'], '#ff0000');

      assert.deepEqual(applied, {
        'panel.background': '#123456',
        'statusBar.background': '#654321',
        'editor.background': '#ff0000',
      });
    });

    test('does not mutate the given customizations', () => {
      const customizations = { 'panel.background': '#123456' };
      TargetColors.apply(customizations, ['editor.background'], '#ff0000');

      assert.deepEqual(customizations, { 'panel.background': '#123456' });
    });

    test('handles missing customizations', () => {
      assert.deepEqual(TargetColors.apply(undefined, ['editor.background'], '#ff0000'), {
        'editor.background': '#ff0000',
      });
    });

    test('handles no targets', () => {
      const customizations = { 'panel.background': '#123456' };

      assert.deepEqual(TargetColors.apply(customizations, [], '#ff0000'), customizations);
    });
  });

  suite('.snapshot', () => {
    test('records the value of each target', () => {
      const customizations = { 'editor.background': '#123456', 'panel.background': '#654321' };
      const snapshot = TargetColors.snapshot(customizations, ['editor.background']);

      assert.deepEqual(snapshot, new Map([['editor.background', '#123456']]));
    });

    test('records an absent target as undefined', () => {
      const snapshot = TargetColors.snapshot({ 'panel.background': '#654321' }, ['editor.background']);

      assert.deepEqual(snapshot, new Map([['editor.background', undefined]]));
    });

    test('handles missing customizations', () => {
      const snapshot = TargetColors.snapshot(undefined, ['editor.background']);

      assert.deepEqual(snapshot, new Map([['editor.background', undefined]]));
    });
  });

  suite('.restore', () => {
    test('puts back the snapshotted values', () => {
      const snapshot = TargetColors.snapshot({ 'editor.background': '#123456' }, ['editor.background']);
      const restored = TargetColors.restore({ 'editor.background': '#ff0000' }, snapshot);

      assert.deepEqual(restored, { 'editor.background': '#123456' });
    });

    test('removes targets that were absent when the snapshot was taken', () => {
      const snapshot = TargetColors.snapshot({}, ['editor.background']);
      const restored = TargetColors.restore({ 'editor.background': '#ff0000' }, snapshot);

      assert.deepEqual(restored, {});
      assert.equal('editor.background' in restored, false);
    });

    test('keeps entries that are not targets', () => {
      const snapshot = TargetColors.snapshot({ 'panel.background': '#123456' }, ['editor.background']);
      const restored = TargetColors.restore(
        { 'panel.background': '#123456', 'statusBar.background': '#abcdef', 'editor.background': '#ff0000' },
        snapshot,
      );

      assert.deepEqual(restored, { 'panel.background': '#123456', 'statusBar.background': '#abcdef' });
    });

    test('keeps entries the user changed while gaming mode was running', () => {
      const snapshot = TargetColors.snapshot({ 'panel.background': '#123456' }, ['editor.background']);
      const restored = TargetColors.restore(
        { 'panel.background': '#ffffff', 'editor.background': '#ff0000' },
        snapshot,
      );

      assert.deepEqual(restored, { 'panel.background': '#ffffff' });
    });

    test('does not mutate the given customizations', () => {
      const snapshot = TargetColors.snapshot({}, ['editor.background']);
      const customizations = { 'editor.background': '#ff0000' };
      TargetColors.restore(customizations, snapshot);

      assert.deepEqual(customizations, { 'editor.background': '#ff0000' });
    });

    test('handles missing customizations', () => {
      const snapshot = TargetColors.snapshot({ 'editor.background': '#123456' }, ['editor.background']);

      assert.deepEqual(TargetColors.restore(undefined, snapshot), { 'editor.background': '#123456' });
    });

    test('handles an empty snapshot', () => {
      const customizations = { 'panel.background': '#123456' };

      assert.deepEqual(TargetColors.restore(customizations, new Map()), customizations);
    });
  });
});
