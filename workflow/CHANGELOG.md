# @platforma-open/milaboratories.redefine-clonotypes.workflow

## 1.11.6

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

- Updated dependencies [95869c4]
  - @platforma-open/milaboratories.redefine-clonotypes.anarci-numbering@1.2.3

## 1.11.5

### Patch Changes

- bb766f0: MILAB-6736: recompute clonotype-level abundance aggregates when clonotypes are merged

  Property columns marked `pl7.app/isAbundance` are themselves aggregates over samples — Supporting Reads, Supporting UMIs, Supporting Cells, Number of Samples, Mean Fraction of Reads, Mean Fraction of UMIs. They were carried over from the most abundant source clonotype, so a merged clonotype reported a single member's value while its per-sample abundances were correctly summed, and the two contradicted each other in the same table row.

  These columns are now recomputed from the block's own redefined abundances: counts are summed over samples, normalized values averaged over the samples where the clonotype is present, and `Number of Samples` taken as the number of distinct samples. Dispatch is driven by `pl7.app/abundance/unit` and `pl7.app/abundance/normalized`, so reads, molecules and cells are all covered without naming individual columns. Property columns that are not abundances keep the representative-value semantics.

- Updated dependencies [bb766f0]
  - @platforma-open/milaboratories.redefine-clonotypes.anarci-numbering@1.2.2
  - @platforma-open/milaboratories.redefine-clonotypes.assembling-fasta@1.1.2

## 1.11.4

### Patch Changes

- 8ca8873: Restore per-step memory and CPU sizing

  Every step of the workflow shared one memory and one CPU value, from FASTA assembly through to the main pt workflow. On large single-cell datasets the property export and the main pt workflow both ran out of memory, while smaller steps reserved the large steps' allocation for their whole duration.

  This restores the per-step sizing the block previously had — property export at 16 GiB / 1 core, imports at 8 GiB / 1 core, ANARCI at 16 GiB / 4 cores, numbering at 8 GiB / 2 cores.

  Adding a single Memory / CPU setting and propagating it to every component changed no value by itself: every step was already at 16 GiB / 1 core, and the imports gained memory. What broke it was raising that shared CPU from 1 to 8 to speed up large datasets. ptabler runs polars with `max(2, cpu)` threads and each thread holds decode buffers for a whole parquet row group, so for a step that reads a p-frame the CPU request multiplies peak memory rather than only buying throughput. The property export inherited 8 threads and exceeded the limit its own earlier fix had set.

  The main pt workflow now gets 32 GiB and keeps its 8 cores — it reads TSVs rather than a p-frame, so it never decodes a parquet row group and the thread multiplier does not apply to it. Only the p-frame readers need their thread count held down. The property export keeps headroom above its original 16 GiB because its cost scales with the number of per-clonotype columns contributed by upstream blocks.

  The property export and the two imports ask for 2 cores rather than the 1 they originally had. ptabler sets its polars thread count to `max(2, cpu)`, so 1 and 2 produce the same two threads and the same memory profile; at 1 those threads simply timeshare a single granted core. Asking for 2 is memory-neutral and only removes the oversubscription.

  ANARCI and deanonymization go back to the sizes they declare for themselves — 16 GiB / 4 cores and 8 GiB / 2 cores. ANARCI's 4 is the value its `--ncpu` argument was chosen to match; the 8 cores it inherited from the shared setting were collateral from a change aimed at polars, which ANARCI does not use. Numbering with ANARCI will therefore run on 4 cores rather than 8. The numbering TSV builders fall back to the SDK's data-derived sizing formula.

  An explicit Memory / CPU override in the block settings still applies to every step, unchanged.

- 3612423: Upgrade the Platforma SDK

  workflow-tengo 6.6.1 → 6.8.2, model 1.79.6 → 1.80.13, ui-vue 1.79.6 → 1.80.15, block-tools 2.10.19 → 2.12.11, package-builder 3.13.0 → 3.14.2, tengo-builder 4.0.8 → 4.0.21, test 1.79.10 → 1.80.16, ts-builder 1.5.2 → 1.6.1, ts-configs 1.2.3 → 1.3.1.

  workflow-tengo 6.8.2 brings ptabler 2.1.8, whose PFrame reader streams a parquet row group once rather than re-slicing it per batch.

## 1.11.3

### Patch Changes

- 4f99fa6: Migrate block onto the structurer (block-tools structure) and upgrade the SDK toolchain: workflow-tengo 6.6.1, tengo-builder 4.0.8, model/ui-vue 1.79.6, test 1.79.10. Replaces hand-maintained config (eslint) with the tool-managed layout (oxlint/oxfmt, ts-builder check). No functional changes.
- Updated dependencies [4f99fa6]
  - @platforma-open/milaboratories.redefine-clonotypes.anarci-numbering@1.2.1
  - @platforma-open/milaboratories.redefine-clonotypes.assembling-fasta@1.1.1

## 1.11.2

### Patch Changes

- 553d77d: Input data label renaming

## 1.11.1

### Patch Changes

- 47a1b0c: Make axis label visible by default

## 1.11.0

### Minor Changes

- 95a8ca3: Add `pl7.app/vdj/redefineSourceCount` export column: per redefined clonotype, the number of distinct original clonotypes that were merged into it. Usable as a convergence metric in downstream blocks.

## 1.10.0

### Minor Changes

- 7f20d6f: Fix early spec export: replace wf.prepare with PColumnBundle await so downstream blocks can configure inputs before computation completes

## 1.9.0

### Minor Changes

- b9d2ca5: Multiple chain selection

## 1.8.0

### Minor Changes

- 9a035ee: Early spec export for faster downstream pipeline setup, configurable memory/CPU in Advanced Settings, code organization improvements with extracted numbering template and shared helpers, integration tests

## 1.7.1

### Patch Changes

- bef4263: Update anarci software package version to fix container start command

## 1.7.0

### Minor Changes

- 119fa05: fix division error when there are no inputs

## 1.6.0

### Minor Changes

- 02b09f9: Deal with empty results after ANARCI numbering

### Patch Changes

- Updated dependencies [02b09f9]
  - @platforma-open/milaboratories.redefine-clonotypes.anarci-numbering@1.2.0

## 1.5.4

### Patch Changes

- 689b88c: Set explicit memory limits on remaining containerized commands to prevent OOM kills: xsv.importFile calls (8GiB), ANARCI (16GiB/4cpu), numbering script (8GiB/2cpu)

## 1.5.3

### Patch Changes

- a068278: Set memory limit (16GiB) on propertyTsvBuilder to prevent OOM kills during properties TSV materialization

## 1.5.2

### Patch Changes

- e30ced9: Improve memory usage

## 1.5.1

### Patch Changes

- edd7827: Fix numbering schema for scFv

## 1.5.0

### Minor Changes

- 57b0cea: Harmonize labels

## 1.4.0

### Minor Changes

- 1d0b72a: IMGT, Kabat and Chothia numbering schemes added, dependencies updates
- ba2cf30: numbering schemas and dependencies updates

### Patch Changes

- Updated dependencies [1d0b72a]
- Updated dependencies [ba2cf30]
  - @platforma-open/milaboratories.redefine-clonotypes.anarci-numbering@1.1.0
  - @platforma-open/milaboratories.redefine-clonotypes.assembling-fasta@1.1.0

## 1.3.1

### Patch Changes

- f581ff4: Updated SDK

## 1.3.0

### Minor Changes

- 3e6721f: Ensure same results given same input

## 1.2.0

### Minor Changes

- 68f61a6: Show running state and support custom block labels

## 1.1.1

### Patch Changes

- c480a29: Migrate to new block template

## 1.1.0

### Minor Changes

- 92ae47a: fix normalized abundance columns and updating dependencies

## 1.0.4

### Patch Changes

- 7eb1594: Support parquet format (update SDK)

## 1.0.3

### Patch Changes

- 53dc929: technical release
- edeae1d: technical release
- 9fc42b8: technical release
- 5a7b685: technical release

## 1.0.2

### Patch Changes

- 690a463: Workflow re-implementation

## 1.0.1

### Patch Changes

- 9fa7f67: Initial release
