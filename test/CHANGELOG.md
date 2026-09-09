# @platforma-open/milaboratories.redefine-clonotypes.test

## 1.5.0

### Minor Changes

- adc1f4a: Add an optional "Keep top clonotypes" setting: keep only the N redefined clonotypes with the highest total abundance, ranked by the primary abundance column summed across samples. The cut runs on the merged keys, so the retained count is exactly N whenever that many redefined clonotypes exist. Abundance fractions stay relative to the whole sample rather than to the retained subset, and the results panel reports the retained count whenever the cut removed anything. Leaving the field empty keeps every clonotype, so existing projects are unaffected.

### Patch Changes

- Updated dependencies [adc1f4a]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.10.0

## 1.4.5

### Patch Changes

- @platforma-open/milaboratories.redefine-clonotypes.model@1.9.1

## 1.4.4

### Patch Changes

- Updated dependencies [67ee342]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.9.0

## 1.4.3

### Patch Changes

- bb766f0: MILAB-6736: recompute clonotype-level abundance aggregates when clonotypes are merged

  Property columns marked `pl7.app/isAbundance` are themselves aggregates over samples — Supporting Reads, Supporting UMIs, Supporting Cells, Number of Samples, Mean Fraction of Reads, Mean Fraction of UMIs. They were carried over from the most abundant source clonotype, so a merged clonotype reported a single member's value while its per-sample abundances were correctly summed, and the two contradicted each other in the same table row.

  These columns are now recomputed from the block's own redefined abundances: counts are summed over samples, normalized values averaged over the samples where the clonotype is present, and `Number of Samples` taken as the number of distinct samples. Dispatch is driven by `pl7.app/abundance/unit` and `pl7.app/abundance/normalized`, so reads, molecules and cells are all covered without naming individual columns. Property columns that are not abundances keep the representative-value semantics.

- Updated dependencies [bb766f0]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.8.3

## 1.4.2

### Patch Changes

- Updated dependencies [3612423]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.8.2

## 1.4.1

### Patch Changes

- Updated dependencies [4f99fa6]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.8.1

## 1.4.0

### Minor Changes

- b9d2ca5: Multiple chain selection

### Patch Changes

- Updated dependencies [b9d2ca5]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.8.0

## 1.3.1

### Patch Changes

- 9a035ee: Early spec export for faster downstream pipeline setup, configurable memory/CPU in Advanced Settings, code organization improvements with extracted numbering template and shared helpers, integration tests
- Updated dependencies [9a035ee]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.7.0

## 1.3.0

### Minor Changes

- 57b0cea: Harmonize labels

## 1.2.0

### Minor Changes

- 1d0b72a: IMGT, Kabat and Chothia numbering schemes added, dependencies updates
- ba2cf30: numbering schemas and dependencies updates

## 1.1.2

### Patch Changes

- f581ff4: Updated SDK

## 1.1.1

### Patch Changes

- c480a29: Migrate to new block template

## 1.1.0

### Minor Changes

- 92ae47a: fix normalized abundance columns and updating dependencies

## 1.0.2

### Patch Changes

- 53dc929: technical release
- edeae1d: technical release
- 9fc42b8: technical release
- 5a7b685: technical release

## 1.0.1

### Patch Changes

- 9fa7f67: Initial release
