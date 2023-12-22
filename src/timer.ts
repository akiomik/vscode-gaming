export class Timer {
  private static instance: Timer;
  private _timer: NodeJS.Timeout | null;

  private constructor() {
    this._timer = null;
  }

  static getInstance() {
    if (!Timer.instance) {
      Timer.instance = new Timer();
    }

    return Timer.instance;
  }

  start(f: () => void, interval: number) {
    if (this.isStarted()) {
      console.debug('already started');
      return;
    }

    this._timer = setInterval(f, interval);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  isStarted(): boolean {
    return !!this._timer;
  }
}
