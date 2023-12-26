import * as vscode from 'vscode';

export class Config {
  public readonly period: number;
  public readonly updateTime: number;
  public readonly targets: string[];

  constructor() {
    const gamingConfig = vscode.workspace.getConfiguration('gaming');
    this.period = gamingConfig.period;
    this.updateTime = gamingConfig.updateTime;
    this.targets = gamingConfig.targets;
  }

  delta(): number {
    return (2.0 * Math.PI) / (this.period / this.updateTime);
  }
}
