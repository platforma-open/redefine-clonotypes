import { DataModelBuilder } from "@platforma-sdk/model";
import { kind } from "@platforma-open/milaboratories.redefine-clonotypes.kind";
import { getDefaultBlockLabel } from "./label";
import type { BlockData, LegacyBlockArgs } from "./types";

export const blockDataModel = new DataModelBuilder({ kind })
  .from<BlockData>("v1")
  // V1 held every field in `args` and declared no `uiState`, so the upgrade is
  // a field-for-field lift with defaults for anything a V1 project could have
  // been saved without.
  .upgradeLegacy<LegacyBlockArgs, Record<string, never>>(({ args }) => ({
    defaultBlockLabel:
      args?.defaultBlockLabel ?? getDefaultBlockLabel({ clonotypeDefinitionLabels: [] }),
    customBlockLabel: args?.customBlockLabel ?? "",
    inputRef: args?.inputRef,
    selectedChainRefs: args?.selectedChainRefs ?? [],
    clonotypeDefinition: args?.clonotypeDefinition ?? [],
    numberingScheme: args?.numberingScheme,
    mem: args?.mem,
    cpu: args?.cpu,
  }))
  .init(({ params }) => ({
    defaultBlockLabel: getDefaultBlockLabel({ clonotypeDefinitionLabels: [] }),
    customBlockLabel: params?.customBlockLabel ?? "",
    inputRef: params?.inputRef,
    selectedChainRefs: params?.selectedChainRefs ?? [],
    clonotypeDefinition: params?.clonotypeDefinition ?? [],
    numberingScheme: params?.numberingScheme,
    mem: params?.mem,
    cpu: params?.cpu,
  }));
