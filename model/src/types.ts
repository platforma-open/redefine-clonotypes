import type { ColumnUniversalId, PlRef } from "@platforma-sdk/model";
// The numbering-scheme vocabulary lives in the kind: its init-params contract
// names the type and a kind cannot import from the model.
import type { NumberingScheme } from "@platforma-open/milaboratories.redefine-clonotypes.kind";

/**
 * Unified V3 data — the block's persisted state.
 *
 * V1 kept all of this in `args` and had no `uiState` at all, so there is no
 * UI-only field to separate out here: every one is a user-committed analysis
 * decision the workflow consumes, including both label fields (the workflow
 * reads them for the provenance trace). `defaultBlockLabel` is the one derived
 * field -- a `watchEffect` in `ui/src/app.ts` writes it from the chosen
 * definition's option labels -- so it is projected but never templated.
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
 * and no staging phase, so nothing is withheld. The lambda's job is the run
 * gate, which V1 expressed as `.argsValid`.
 */
export type BlockArgs = BlockData;

/** Legacy (V1) on-disk shape, consumed once by `.upgradeLegacy`. */
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
