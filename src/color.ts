export class Color {
  public r: number;
  public g: number;
  public b: number;

  constructor(r: number, g: number, b: number) {
    if (r < 0 || r > 255) {
      throw new RangeError('r must be in range [0, 255]');
    }

    if (g < 0 || g > 255) {
      throw new RangeError('g must be in range [0, 255]');
    }

    if (b < 0 || b > 255) {
      throw new RangeError('b must be in range [0, 255]');
    }

    this.r = Math.round(r);
    this.g = Math.round(g);
    this.b = Math.round(b);
  }

  private hex(a: number): string {
    return a.toString(16).padStart(2, '0');
  }

  public code(): string {
    return `#${this.hex(this.r)}${this.hex(this.g)}${this.hex(this.b)}`;
  }
}
