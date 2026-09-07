# @platforma-open/milaboratories.redefine-clonotypes

## 1.7.2

### Patch Changes

- 50066d5: Bump the kind version. The previous release widened the kind's column-id check without bumping it, and the registry refuses that: a kind version's content is immutable, so publishing 1.0.0 with a different `sourceHash` hard-fails and takes the whole block publish with it.

## 1.7.1

### Patch Changes

- ac907bc: Fix the kind refusing the column ids the block itself writes. `clonotypeDefinition` holds ids minted by `resultPool.getCanonicalOptions`, which are _anchored_ keys; `isColumnUniversalId` recognizes only the newer key forms and rejects those, so applying a template exported from this block failed with "'clonotypeDefinition' must be an array of column ids." Both forms are now accepted, matching what `clonotype-clustering`, `clonotype-enrichment` and `clonotype-space` already do.

## 1.7.0

### Minor Changes

- 67ee342: Migrate the model to BlockModelV3 and add the mandatory block kind, alongside the structurer migration and full SDK upgrade (block-tools 2.14.3, tengo-builder 4.0.23, model 1.83.0).

  The persisted shape is unchanged: a legacy upgrader lifts V1 `args` field-for-field into the unified `data`. UI bindings move to `app.model.data`. The kind's init-params contract is the clonotyping run, the chains, the clonotype definition, the numbering scheme, the block subtitle and the resource knobs, so a project template can seed a configured Redefine Clonotypes block.

## 1.6.6

### Patch Changes

- 95869c4: Rebuild ANARCI's numbering column order before assembling regions.

  ANARCI orders its CSV header by insertion ranks pooled across the whole file. A
  sequence carrying a deletion beside an insertion slot leaves two positions
  sharing a rank, and that tie is broken by `set` iteration order, which Python
  randomises per process. The numbering script consumed the header positionally,
  so one such sequence reordered residues within a region for every sequence in
  the sample, differently on each run. Kabat and Chothia place 82A/82B/82C inside
  FR3, so the visible symptom was a scrambled framework.

  Insertion direction is taken from the scheme rather than inferred from the
  header, since the header is the corrupted input: IMGT indices 33, 61 and 112
  count down (112J ... 112A, 112) while Kabat and Chothia only count up.

## 1.6.5

### Patch Changes

- bb766f0: MILAB-6736: recompute clonotype-level abundance aggregates when clonotypes are merged

  Property columns marked `pl7.app/isAbundance` are themselves aggregates over samples — Supporting Reads, Supporting UMIs, Supporting Cells, Number of Samples, Mean Fraction of Reads, Mean Fraction of UMIs. They were carried over from the most abundant source clonotype, so a merged clonotype reported a single member's value while its per-sample abundances were correctly summed, and the two contradicted each other in the same table row.

  These columns are now recomputed from the block's own redefined abundances: counts are summed over samples, normalized values averaged over the samples where the clonotype is present, and `Number of Samples` taken as the number of distinct samples. Dispatch is driven by `pl7.app/abundance/unit` and `pl7.app/abundance/normalized`, so reads, molecules and cells are all covered without naming individual columns. Property columns that are not abundances keep the representative-value semantics.

## 1.6.4

### Patch Changes

- 3612423: Upgrade the Platforma SDK

  workflow-tengo 6.6.1 → 6.8.2, model 1.79.6 → 1.80.13, ui-vue 1.79.6 → 1.80.15, block-tools 2.10.19 → 2.12.11, package-builder 3.13.0 → 3.14.2, tengo-builder 4.0.8 → 4.0.21, test 1.79.10 → 1.80.16, ts-builder 1.5.2 → 1.6.1, ts-configs 1.2.3 → 1.3.1.

  workflow-tengo 6.8.2 brings ptabler 2.1.8, whose PFrame reader streams a parquet row group once rather than re-slicing it per batch.

- Updated dependencies [8ca8873]
- Updated dependencies [3612423]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.11.4
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.8.2
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.8.3

## 1.6.3

### Patch Changes

- Updated dependencies [4f99fa6]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.8.1
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.8.2
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.11.3

## 1.6.2

### Patch Changes

- 553d77d: Input data label renaming
- Updated dependencies [553d77d]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.11.2
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.8.1

## 1.6.1

### Patch Changes

- Updated dependencies [47a1b0c]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.11.1

## 1.6.0

### Minor Changes

- 95a8ca3: Add `pl7.app/vdj/redefineSourceCount` export column: per redefined clonotype, the number of distinct original clonotypes that were merged into it. Usable as a convergence metric in downstream blocks.

### Patch Changes

- Updated dependencies [95a8ca3]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.11.0

## 1.5.0

### Minor Changes

- 7f20d6f: Fix early spec export: replace wf.prepare with PColumnBundle await so downstream blocks can configure inputs before computation completes

### Patch Changes

- Updated dependencies [7f20d6f]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.10.0

## 1.4.1

### Patch Changes

- Updated dependencies [b9d2ca5]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.9.0
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.8.0
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.8.0

## 1.4.0

### Minor Changes

- 9a035ee: Early spec export for faster downstream pipeline setup, configurable memory/CPU in Advanced Settings, code organization improvements with extracted numbering template and shared helpers, integration tests

### Patch Changes

- Updated dependencies [9a035ee]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.7.0
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.7.0
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.8.0

## 1.3.2

### Patch Changes

- Updated dependencies [bef4263]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.7.1

## 1.3.1

### Patch Changes

- Updated dependencies [807e790]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.6.1
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.6.1

## 1.3.0

### Minor Changes

- 119fa05: fix division error when there are no inputs

### Patch Changes

- Updated dependencies [119fa05]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.7.0
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.6.0
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.6.0

## 1.2.7

### Patch Changes

- Updated dependencies [02b09f9]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.6.0
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.5.0
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.5.0

## 1.2.6

### Patch Changes

- Updated dependencies [689b88c]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.5.4

## 1.2.5

### Patch Changes

- Updated dependencies [a068278]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.5.3

## 1.2.4

### Patch Changes

- Updated dependencies [e30ced9]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.5.2

## 1.2.3

### Patch Changes

- edd7827: Fix numbering schema for scFv
- Updated dependencies [edd7827]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.5.1

## 1.2.2

### Patch Changes

- Updated dependencies [57b0cea]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.5.0
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.4.0
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.4.0

## 1.2.1

### Patch Changes

- Updated dependencies [7469b2a]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.3.1
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.3.1

## 1.2.0

### Minor Changes

- 1d0b72a: IMGT, Kabat and Chothia numbering schemes added, dependencies updates
- ba2cf30: numbering schemas and dependencies updates

### Patch Changes

- Updated dependencies [1d0b72a]
- Updated dependencies [ba2cf30]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.4.0
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.3.0
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.3.0

## 1.1.6

### Patch Changes

- 82062d1: Added migration for labels
- Updated dependencies [82062d1]
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.2.3

## 1.1.5

### Patch Changes

- f581ff4: Updated SDK
- Updated dependencies [f581ff4]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.2.2
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.2.2
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.3.1

## 1.1.4

### Patch Changes

- Updated dependencies [3e6721f]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.3.0

## 1.1.3

### Patch Changes

- Updated dependencies [b51b375]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.2.1
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.2.1

## 1.1.2

### Patch Changes

- Updated dependencies [68f61a6]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.2.0
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.2.0
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.2.0

## 1.1.1

### Patch Changes

- c480a29: Migrate to new block template
- Updated dependencies [c480a29]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.1.1
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.1.1
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.1.1

## 1.1.0

### Minor Changes

- 92ae47a: fix normalized abundance columns and updating dependencies

### Patch Changes

- Updated dependencies [92ae47a]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.1.0
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.1.0
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.1.0

## 1.0.6

### Patch Changes

- Updated dependencies [7359f01]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.0.3
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.0.3

## 1.0.5

### Patch Changes

- 77eabda: Update SDK

## 1.0.4

### Patch Changes

- Updated dependencies [7eb1594]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.0.4

## 1.0.3

### Patch Changes

- 53dc929: technical release
- edeae1d: technical release
- 9fc42b8: technical release
- 5a7b685: technical release
- Updated dependencies [53dc929]
- Updated dependencies [edeae1d]
- Updated dependencies [9fc42b8]
- Updated dependencies [5a7b685]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.0.2
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.0.2
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.0.3

## 1.0.2

### Patch Changes

- Updated dependencies [690a463]
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.0.2

## 1.0.1

### Patch Changes

- 9fa7f67: Initial release
- Updated dependencies [9fa7f67]
  - @platforma-open/milaboratories.redefine-clonotypes.model@1.0.1
  - @platforma-open/milaboratories.redefine-clonotypes.ui@1.0.1
  - @platforma-open/milaboratories.redefine-clonotypes.workflow@1.0.1
