// The `workbench.colorCustomizations` object. Values are usually color codes, but the setting also
// accepts theme-scoped blocks such as `"[Default Dark+]": { ... }`, so they are not narrowed here.
export type ColorCustomizations = Record<string, unknown>;

// The values that some targets held at a point in time. A target mapped to `undefined` was absent.
export type TargetSnapshot = Map<string, unknown>;

// Operations on the `gaming.targets` entries of a `workbench.colorCustomizations` object.
//
// Every operation copies the object and touches the target entries only, so customizations that
// gaming mode never wrote to are always carried over untouched. This keeps the extension from
// clobbering unrelated colors, and keeps the damage limited to the targets if a restore is missed.
export class TargetColors {
  private constructor() {
    // noop
  }

  // Returns a copy of `customizations` with every target set to `color`.
  public static apply(
    customizations: ColorCustomizations | undefined,
    targets: string[],
    color: string,
  ): ColorCustomizations {
    const overrides = Object.fromEntries(targets.map((target) => [target, color]));

    return { ...customizations, ...overrides };
  }

  // Returns `snapshot` extended with the values the targets currently hold, so that `restore` can
  // put them back. Targets that `snapshot` already covers keep their recorded value: once gaming
  // mode has run, the customizations hold gaming colors, and re-reading them would record those
  // instead of the values the user started with.
  public static record(
    snapshot: TargetSnapshot,
    customizations: ColorCustomizations | undefined,
    targets: string[],
  ): TargetSnapshot {
    const recorded: TargetSnapshot = new Map(snapshot);

    for (const target of targets) {
      if (!recorded.has(target)) {
        recorded.set(target, customizations?.[target]);
      }
    }

    return recorded;
  }

  // Returns a copy of `customizations` with the snapshotted targets put back. Targets that were
  // absent when the snapshot was taken are removed again instead of being set to `undefined`.
  public static restore(
    customizations: ColorCustomizations | undefined,
    snapshot: TargetSnapshot,
  ): ColorCustomizations {
    const restored: ColorCustomizations = { ...customizations };

    for (const [target, original] of snapshot) {
      if (original === undefined) {
        delete restored[target];
      } else {
        restored[target] = original;
      }
    }

    return restored;
  }
}
