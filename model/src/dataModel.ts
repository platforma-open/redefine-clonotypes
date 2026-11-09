import { DataModelBuilder } from "@platforma-sdk/model";
import { kind } from "@platforma-open/milaboratories.redefine-clonotypes.kind";
import { NO_DEFINITION_SUBTITLE } from "./label";
import type { BlockData, LegacyBlockArgs } from "./types";

type BlockDataV1 = Omit<BlockData, "subtitleLabel"> & {
  defaultBlockLabel: string;
};

export const blockDataModel = new DataModelBuilder({ kind })
  .from<BlockDataV1>("v1")
  // A field-for-field lift, with defaults for every field the legacy shape
  // allows to be absent.
  .upgradeLegacy<LegacyBlockArgs, Record<string, never>>(({ args }) => ({
    defaultBlockLabel: args?.defaultBlockLabel ?? "",
    customBlockLabel: args?.customBlockLabel ?? "",
    inputRef: args?.inputRef,
    selectedChainRefs: args?.selectedChainRefs ?? [],
    clonotypeDefinition: args?.clonotypeDefinition ?? [],
    numberingScheme: args?.numberingScheme,
    mem: args?.mem,
    cpu: args?.cpu,
  }))
  // The old label was exactly the result-pool labels of the chosen definition
  // columns, so it carries over as the subtitle. The placeholder it held while
  // nothing was chosen is not a label.
  .migrate<BlockData>("v2", ({ defaultBlockLabel, ...rest }) => ({
    ...rest,
    subtitleLabel: defaultBlockLabel === NO_DEFINITION_SUBTITLE ? "" : defaultBlockLabel,
  }))
  .init(({ params }) => ({
    customBlockLabel: params?.customBlockLabel ?? "",
    subtitleLabel: "",
    inputRef: params?.inputRef,
    selectedChainRefs: params?.selectedChainRefs ?? [],
    clonotypeDefinition: params?.clonotypeDefinition ?? [],
    numberingScheme: params?.numberingScheme,
    topClonotypes: params?.topClonotypes,
    mem: params?.mem,
    cpu: params?.cpu,
  }));
