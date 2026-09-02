import { assertParamsObject, defineBlockKind } from "@platforma-sdk/block-kind";
import type { ColumnUniversalId, PlRef } from "@platforma-sdk/model";
import { isColumnUniversalId, isPlRef } from "@platforma-sdk/model";
import { name, version } from "../package.json" with { type: "json" };

/** The residue-numbering schemes the block can apply. */
export type NumberingScheme = "imgt" | "kabat" | "chothia";

const NUMBERING_SCHEMES: readonly string[] = ["imgt", "kabat", "chothia"];

/**
 * This block's init-params contract — everything a user sets by hand: the
 * clonotyping run, the chains to redefine over, the columns that make up the
 * new clonotype definition, the numbering scheme, the subtitle they type, and
 * the resource knobs.
 *
 * Left out: `defaultBlockLabel`, which a `watchEffect` in `ui/src/app.ts`
 * derives from the chosen definition's option labels.
 *
 * Every field is optional because the projection hands live state back
 * untouched, and a half-configured block is ordinary state the UI reaches.
 * Requiring one would make the block export a file its own kind refuses to
 * apply, so export and apply would stop being inverses.
 */
export type BlockParams = {
  inputRef?: PlRef;
  selectedChainRefs?: PlRef[];
  clonotypeDefinition?: ColumnUniversalId[];
  numberingScheme?: NumberingScheme;
  customBlockLabel?: string;
  mem?: number;
  cpu?: number;
};

/** The same contract at runtime, for params arriving from a template file rather than typed code. */
function parseInitializationParams(value: unknown): BlockParams {
  assertParamsObject(value);

  const {
    inputRef,
    selectedChainRefs,
    clonotypeDefinition,
    numberingScheme,
    customBlockLabel,
    mem,
    cpu,
  } = value;

  if (inputRef !== undefined && !isPlRef(inputRef)) {
    throw new Error(
      "'inputRef' must be a reference to an upstream column, written as { block, name }.",
    );
  }
  if (selectedChainRefs !== undefined) {
    if (!Array.isArray(selectedChainRefs) || !selectedChainRefs.every(isPlRef)) {
      throw new Error("'selectedChainRefs' must be an array of { block, name } references.");
    }
  }
  if (clonotypeDefinition !== undefined) {
    if (!Array.isArray(clonotypeDefinition) || !clonotypeDefinition.every(isColumnUniversalId)) {
      throw new Error("'clonotypeDefinition' must be an array of column ids.");
    }
  }
  if (numberingScheme !== undefined && !NUMBERING_SCHEMES.includes(numberingScheme as string)) {
    throw new Error(`'numberingScheme' must be one of: ${NUMBERING_SCHEMES.join(", ")}.`);
  }
  if (customBlockLabel !== undefined && typeof customBlockLabel !== "string") {
    throw new Error("'customBlockLabel' must be a string.");
  }
  if (mem !== undefined && typeof mem !== "number") throw new Error("'mem' must be a number.");
  if (cpu !== undefined && typeof cpu !== "number") throw new Error("'cpu' must be a number.");

  return {
    inputRef,
    selectedChainRefs: selectedChainRefs as PlRef[] | undefined,
    clonotypeDefinition: clonotypeDefinition as ColumnUniversalId[] | undefined,
    numberingScheme: numberingScheme as NumberingScheme | undefined,
    customBlockLabel,
    mem,
    cpu,
  };
}

// Identity (`name`/`version`) comes from this package's own `package.json`, so
// the on-wire `{name}@{version}` reference can never drift from what npm
// publishes; the bundler inlines the JSON import.
export const kind = defineBlockKind<BlockParams>({ name, version, parseInitializationParams });
