export class Timer {
  private static instance: Timer;
  private _timer: NodeJS.Timeout | null;

  private constructor() {
    this._timer = null;
  }

  static getInstance() {
    if (!Timer.instance) {
      Timer.instance = new Timer();
      console.log('Timer.getInstance: create new instance:', Timer.instance);
    }

    console.log('Timer.getInstance: return existing instance:', Timer.instance);
    return Timer.instance;
  }

  start(f: () => void, interval: number) {
    console.log('Timer#start: start', Timer.instance);

    if (this.isRunning()) {
      console.debug('already started');
      return;
    }

    console.log('Timer#start: start setInterval', Timer.instance);
    this._timer = setInterval(f, interval);
    console.log('Timer#start: _timer = ', this._timer, Timer.instance);
  }

  stop() {
    console.log('Timer#stop: start', Timer.instance);
    if (this._timer) {
      console.log('Timer#stop: clear timer', Timer.instance);
      clearInterval(this._timer);
      this._timer = null;
      console.log('Timer#stop: cleared timer');
    }
  }

  isRunning(): boolean {
    console.log('Timer#isRunning', this._timer, !!this._timer, Timer.instance);
    return !!this._timer;
  }
}
