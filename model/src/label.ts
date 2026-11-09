import type { BlockData } from "./types";

/** Subtitle the block list shows while no definition column is chosen. */
export const NO_DEFINITION_SUBTITLE = "Select Clonotype Definition";

/** Settings part of the block label, shared by the trace label and the subtitle.
 *  Both settings are absent by default, so the common label carries none. */
export function labelFromParams(data: BlockData): string {
  const parts: string[] = [];
  if (data.numberingScheme !== undefined) parts.push(NUMBERING_SCHEME_LABELS[data.numberingScheme]);
  if (data.topClonotypes !== undefined) parts.push(`top ${data.topClonotypes}`);
  return parts.join(", ");
}

/** Subtitle shown when the user has not set a custom block label. */
export function defaultSubtitle(data: BlockData): string {
  if (data.clonotypeDefinition.length === 0) return NO_DEFINITION_SUBTITLE;
  return [data.subtitleLabel, labelFromParams(data)].filter(Boolean).join(", ");
}

// Internals

const NUMBERING_SCHEME_LABELS: Record<NonNullable<BlockData["numberingScheme"]>, string> = {
  imgt: "IMGT",
  kabat: "Kabat",
  chothia: "Chothia",
};
