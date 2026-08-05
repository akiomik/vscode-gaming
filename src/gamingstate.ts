import type * as vscode from 'vscode';

import type { TargetSnapshot } from './targetcolors';

const STATE_KEY = 'vscode-gaming.originalTargets';

// The stored form of a `TargetSnapshot`. A `Map` is not JSON-serializable, and a target that was
// absent has to survive the round trip as absent rather than as a null value, so an entry for such
// a target simply carries no `original`.
type StoredEntry = {
  target: string;
  original?: unknown;
};

function isStoredEntry(value: unknown): value is StoredEntry {
  return typeof value === 'object' && value !== null && typeof (value as StoredEntry).target === 'string';
}

// The values gaming mode has to put back, kept somewhere that outlives the extension host.
//
// Nothing else records them: the colors gaming mode writes go straight into the user settings, so
// once the host is gone the settings hold gaming colors and the values they replaced are only
// recoverable from here.
export class GamingState {
  private readonly memento: vscode.Memento;

  constructor(memento: vscode.Memento) {
    this.memento = memento;
  }

  // Entries that cannot be read back are dropped rather than throwing: a snapshot this extension
  // no longer understands is not worth failing activation over, and the colors it describes are
  // the ones the user can still fix by hand.
  public load(): TargetSnapshot {
    const stored = this.memento.get<unknown>(STATE_KEY);
    if (!Array.isArray(stored)) {
      return new Map();
    }

    return new Map(stored.filter(isStoredEntry).map((entry) => [entry.target, entry.original]));
  }

  public async save(snapshot: TargetSnapshot): Promise<void> {
    const stored: StoredEntry[] = Array.from(snapshot, ([target, original]) =>
      original === undefined ? { target } : { target, original },
    );

    await this.memento.update(STATE_KEY, stored);
  }

  public async clear(): Promise<void> {
    await this.memento.update(STATE_KEY, undefined);
  }
}
