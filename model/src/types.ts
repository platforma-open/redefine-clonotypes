import type { ColumnUniversalId, PlRef } from "@platforma-sdk/model";
// The numbering-scheme vocabulary lives in the kind: its init-params contract
// names the type and a kind cannot import from the model.
import type { NumberingScheme } from "@platforma-open/milaboratories.redefine-clonotypes.kind";

/**
 * Unified V3 data — the block's persisted state.
 *
 * Every field but `subtitleLabel` is a user-committed analysis decision the
 * workflow consumes; it reads `customBlockLabel` for the provenance trace.
 */
export type BlockData = {
  customBlockLabel: string;
  /** Result-pool labels of the chosen definition columns, shown in the subtitle.
   *  Written by the definition picker on a user pick; never reaches the workflow. */
  subtitleLabel?: string;
  inputRef?: PlRef;
  selectedChainRefs: PlRef[];
  clonotypeDefinition: ColumnUniversalId[];
  numberingScheme?: NumberingScheme;
  /** Keep only the N redefined clonotypes with the highest total primary
   *  abundance. Absent means keep every one of them. */
  topClonotypes?: number;
  mem?: number;
  cpu?: number;
};

/**
 * Workflow-facing args: `data` without the subtitle text, plus the settings
 * part of the trace label. The block has no staging phase. The lambda that
 * produces it is the run gate.
 */
export type BlockArgs = Omit<BlockData, "subtitleLabel"> & {
  paramsLabel: string;
};

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
