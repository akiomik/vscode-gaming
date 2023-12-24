import * as assert from 'assert';
import * as vscode from 'vscode';

import { Timer } from '../timer';

suite('Commands', () => {
  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension("omi.vscode-gaming");
    await ext!.activate();
  });

  test('vscode-gaming.start', async () => {
    const config = vscode.workspace.getConfiguration();
    const timer = Timer.getInstance();
    assert.deepEqual(config.get('workbench.colorCustomizations'), {});
    assert.equal(timer.isRunning(), false);

    await vscode.commands.executeCommand('vscode-gaming.start');

    assert.equal(timer.isRunning(), true);
    assert.deepEqual(config.get('workbench.colorCustomizations'), {}); // FIXME
  });

  test('vscode-gaming.stop', async () => {
    const config = vscode.workspace.getConfiguration();
    const timer = Timer.getInstance();
    assert.deepEqual(config.get('workbench.colorCustomizations'), {}); // FIXME
    assert.equal(timer.isRunning(), true);

    await vscode.commands.executeCommand('vscode-gaming.stop');

    assert.equal(timer.isRunning(), false);
    assert.deepEqual(config.get('workbench.colorCustomizations'), {});
  });
});
