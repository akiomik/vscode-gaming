import type * as vscode from 'vscode';

import type { TargetSnapshot } from './targetcolors';

const STATE_KEY = 'vscode-gaming.originalTargets';

// What a gaming session has to put back when it ends.
export type GamingRecord = {
  targets: TargetSnapshot;

  // The longest update time of any session that has contributed to this record. Every window
  // shares it, so a window deciding whether anyone is still animating has to watch for a tick of
  // the slowest animation that could be running, which need not be running at the
  // `gaming.updateTime` configured for this window.
  updateTime: number;
};

// The stored form of a `TargetSnapshot` entry. A `Map` is not JSON-serializable, and a target that
// was absent has to survive the round trip as absent rather than as a null value, so an entry for
// such a target simply carries no `original`.
type StoredEntry = {
  target: string;
  original?: unknown;
};

type StoredRecord = {
  targets: StoredEntry[];
  updateTime: number;
};

function isStoredEntry(value: unknown): value is StoredEntry {
  return typeof value === 'object' && value !== null && typeof (value as StoredEntry).target === 'string';
}

function isStoredRecord(value: unknown): value is StoredRecord {
  if (typeof value !== 'object' || value === null || !Array.isArray((value as StoredRecord).targets)) {
    return false;
  }

  // A NaN would survive into the time the colors are watched for and make it elapse immediately
  const { updateTime } = value as StoredRecord;

  return Number.isFinite(updateTime) && updateTime >= 0;
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

  // Anything that cannot be read back is dropped rather than thrown: a record this extension no
  // longer understands is not worth failing activation over, and the colors it describes are the
  // ones the user can still fix by hand. It is reported, so that a bug here is at least traceable.
  public load(): GamingRecord {
    const stored = this.memento.get<unknown>(STATE_KEY);
    if (stored === undefined) {
      return { targets: new Map(), updateTime: 0 };
    }

    if (!isStoredRecord(stored)) {
      console.warn('vscode-gaming: ignoring an unreadable record of the original colors', stored);

      return { targets: new Map(), updateTime: 0 };
    }

    const entries = stored.targets.filter(isStoredEntry);
    if (entries.length !== stored.targets.length) {
      console.warn('vscode-gaming: ignoring unreadable entries in the record of the original colors', stored.targets);
    }

    return {
      targets: new Map(entries.map((entry) => [entry.target, entry.original])),
      updateTime: stored.updateTime,
    };
  }

  public async save(record: GamingRecord): Promise<void> {
    const stored: StoredRecord = {
      targets: Array.from(record.targets, ([target, original]) =>
        original === undefined ? { target } : { target, original },
      ),
      updateTime: record.updateTime,
    };

    await this.memento.update(STATE_KEY, stored);
  }

  public async clear(): Promise<void> {
    await this.memento.update(STATE_KEY, undefined);
  }
}
