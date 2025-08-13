export class Timer {
  private static instance?: Timer;
  private _timer?: NodeJS.Timeout;

  static getInstance() {
    if (!Timer.instance) {
      Timer.instance = new Timer();
    }

    return Timer.instance;
  }

  static resetInstance() {
    if (Timer.instance) {
      Timer.instance.stop();
      Timer.instance = undefined;
    }
  }

  start(f: () => void, interval: number) {
    if (this.isRunning()) {
      return;
    }

    this._timer = setInterval(f, interval);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }

  isRunning(): boolean {
    return !!this._timer;
  }
}
