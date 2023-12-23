import { Color } from './color';

export class ColorWheel {
  private constructor() {
    // noop
  }

  // Converts radian to [0, 255] range
  private static scale255(rad: number): number {
    return ((Math.sin(rad) + 1) / 2) * 255;
  }

  // Rounds 127.49999999999997 as 127.5
  private static round1(a: number): number {
    return Math.round(a * 10) / 10;
  }

  public static at(rad: number): Color {
    const r = rad;
    const g = (2 * Math.PI / 3) + rad;
    const b = (2 * Math.PI / (2 / 3)) + rad;

    return new Color(
      ColorWheel.round1(ColorWheel.scale255(r)),
      ColorWheel.round1(ColorWheel.scale255(g)),
      ColorWheel.round1(ColorWheel.scale255(b)),
    );
  }
}
