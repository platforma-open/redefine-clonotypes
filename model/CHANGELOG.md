# @platforma-open/milaboratories.redefine-clonotypes.model

## 1.10.0

### Minor Changes

- adc1f4a: Add an optional "Keep top clonotypes" setting: keep only the N redefined clonotypes with the highest total abundance, ranked by the primary abundance column summed across samples. The cut runs on the merged keys, so the retained count is exactly N whenever that many redefined clonotypes exist. Abundance fractions stay relative to the whole sample rather than to the retained subset, and the results panel reports the retained count whenever the cut removed anything. Leaving the field empty keeps every clonotype, so existing projects are unaffected.

### Patch Changes

- Updated dependencies [adc1f4a]
  - @platforma-open/milaboratories.redefine-clonotypes.kind@1.1.0

## 1.9.1

### Patch Changes

- Updated dependencies [50066d5]
  - @platforma-open/milaboratories.redefine-clonotypes.kind@1.0.1

## 1.9.0

### Minor Changes

- 67ee342: Migrate the model to BlockModelV3 and add the mandatory block kind, alongside the structurer migration and full SDK upgrade (block-tools 2.14.3, tengo-builder 4.0.23, model 1.83.0).

  The persisted shape is unchanged: a legacy upgrader lifts V1 `args` field-for-field into the unified `data`. UI bindings move to `app.model.data`. The kind's init-params contract is the clonotyping run, the chains, the clonotype definition, the numbering scheme, the block subtitle and the resource knobs, so a project template can seed a configured Redefine Clonotypes block.

## 1.8.3

### Patch Changes

- bb766f0: MILAB-6736: recompute clonotype-level abundance aggregates when clonotypes are merged

  Property columns marked `pl7.app/isAbundance` are themselves aggregates over samples — Supporting Reads, Supporting UMIs, Supporting Cells, Number of Samples, Mean Fraction of Reads, Mean Fraction of UMIs. They were carried over from the most abundant source clonotype, so a merged clonotype reported a single member's value while its per-sample abundances were correctly summed, and the two contradicted each other in the same table row.

  These columns are now recomputed from the block's own redefined abundances: counts are summed over samples, normalized values averaged over the samples where the clonotype is present, and `Number of Samples` taken as the number of distinct samples. Dispatch is driven by `pl7.app/abundance/unit` and `pl7.app/abundance/normalized`, so reads, molecules and cells are all covered without naming individual columns. Property columns that are not abundances keep the representative-value semantics.

## 1.8.2

### Patch Changes

- 3612423: Upgrade the Platforma SDK

  workflow-tengo 6.6.1 → 6.8.2, model 1.79.6 → 1.80.13, ui-vue 1.79.6 → 1.80.15, block-tools 2.10.19 → 2.12.11, package-builder 3.13.0 → 3.14.2, tengo-builder 4.0.8 → 4.0.21, test 1.79.10 → 1.80.16, ts-builder 1.5.2 → 1.6.1, ts-configs 1.2.3 → 1.3.1.

  workflow-tengo 6.8.2 brings ptabler 2.1.8, whose PFrame reader streams a parquet row group once rather than re-slicing it per batch.

## 1.8.1

### Patch Changes

- 4f99fa6: Migrate block onto the structurer (block-tools structure) and upgrade the SDK toolchain: workflow-tengo 6.6.1, tengo-builder 4.0.8, model/ui-vue 1.79.6, test 1.79.10. Replaces hand-maintained config (eslint) with the tool-managed layout (oxlint/oxfmt, ts-builder check). No functional changes.

## 1.8.0

### Minor Changes

- b9d2ca5: Multiple chain selection

## 1.7.0

### Minor Changes

- 9a035ee: Early spec export for faster downstream pipeline setup, configurable memory/CPU in Advanced Settings, code organization improvements with extracted numbering template and shared helpers, integration tests

## 1.6.1

### Patch Changes

- 807e790: Hide numbering when not posible

## 1.6.0

### Minor Changes

- 119fa05: fix division error when there are no inputs

## 1.5.0

### Minor Changes

- 02b09f9: Deal with empty results after ANARCI numbering

## 1.4.0

### Minor Changes

- 57b0cea: Harmonize labels

## 1.3.1

### Patch Changes

- 7469b2a: Improve block label generation

## 1.3.0

### Minor Changes

- 1d0b72a: IMGT, Kabat and Chothia numbering schemes added, dependencies updates
- ba2cf30: numbering schemas and dependencies updates

## 1.2.2

### Patch Changes

- f581ff4: Updated SDK

## 1.2.1

### Patch Changes

- b51b375: Left panel subtitle added by default

## 1.2.0

### Minor Changes

- 68f61a6: Show running state and support custom block labels

## 1.1.1

### Patch Changes

- c480a29: Migrate to new block template

## 1.1.0

### Minor Changes

- 92ae47a: fix normalized abundance columns and updating dependencies

## 1.0.3

### Patch Changes

- 7359f01: Fix definition options

## 1.0.2

### Patch Changes

- 53dc929: technical release
- edeae1d: technical release
- 9fc42b8: technical release
- 5a7b685: technical release

## 1.0.1

### Patch Changes

- 9fa7f67: Initial release
