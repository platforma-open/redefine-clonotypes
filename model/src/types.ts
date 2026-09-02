import type { ColumnUniversalId, PlRef } from "@platforma-sdk/model";
// The numbering-scheme vocabulary lives in the kind: its init-params contract
// names the type and a kind cannot import from the model.
import type { NumberingScheme } from "@platforma-open/milaboratories.redefine-clonotypes.kind";

/**
 * Unified V3 data — the block's persisted state.
 *
 * There is no UI-only field here: every one is a user-committed analysis
 * decision the workflow consumes, including both label fields, which it reads
 * for the provenance trace. `defaultBlockLabel` is the one derived field -- a
 * `watchEffect` in `ui/src/app.ts` writes it from the chosen definition's
 * option labels -- so it is projected but never templated.
 */
export type BlockData = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  inputRef?: PlRef;
  selectedChainRefs: PlRef[];
  clonotypeDefinition: ColumnUniversalId[];
  numberingScheme?: NumberingScheme;
  mem?: number;
  cpu?: number;
};

/**
 * Workflow-facing args. Same field set as `data`: the block has no view state
 * and no staging phase, so nothing is withheld. The lambda that produces it is
 * the run gate.
 */
export type BlockArgs = BlockData;

/** Legacy on-disk shape, read only by `.upgradeLegacy`. */
export type LegacyBlockArgs = {
  defaultBlockLabel?: string;
  customBlockLabel?: string;
  inputRef?: PlRef;
  selectedChainRefs?: PlRef[];
  clonotypeDefinition?: ColumnUniversalId[];
  numberingScheme?: NumberingScheme;
  mem?: number;
  cpu?: number;
};
