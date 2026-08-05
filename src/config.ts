import * as vscode from 'vscode';

export class Config {
  public readonly period: number;
  public readonly updateTime: number;
  public readonly targets: string[];

  constructor() {
    const gamingConfig = vscode.workspace.getConfiguration('gaming');

    // Reading a setting as a property goes through the index signature of `WorkspaceConfiguration`
    // and is typed `any`, so nothing here would be checked. `get` is typed by what it is given as
    // the fallback instead. The fallbacks repeat the defaults contributed in package.json, which
    // is what a read answers with unless the user has set the value; `get` has no way to know that
    // a contributed default exists, and the `Config` tests pin them to those defaults.
    this.period = gamingConfig.get('period', 10000);
    this.updateTime = gamingConfig.get('updateTime', 50);
    this.targets = gamingConfig.get('targets', ['editor.background']);
  }

  delta(): number {
    return (2.0 * Math.PI) / (this.period / this.updateTime);
  }
}
