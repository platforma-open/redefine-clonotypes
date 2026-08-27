# @platforma-open/milaboratories.redefine-clonotypes.anarci-numbering

## 1.2.3

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

## 1.2.2

### Patch Changes

- bb766f0: MILAB-6736: recompute clonotype-level abundance aggregates when clonotypes are merged

  Property columns marked `pl7.app/isAbundance` are themselves aggregates over samples — Supporting Reads, Supporting UMIs, Supporting Cells, Number of Samples, Mean Fraction of Reads, Mean Fraction of UMIs. They were carried over from the most abundant source clonotype, so a merged clonotype reported a single member's value while its per-sample abundances were correctly summed, and the two contradicted each other in the same table row.

  These columns are now recomputed from the block's own redefined abundances: counts are summed over samples, normalized values averaged over the samples where the clonotype is present, and `Number of Samples` taken as the number of distinct samples. Dispatch is driven by `pl7.app/abundance/unit` and `pl7.app/abundance/normalized`, so reads, molecules and cells are all covered without naming individual columns. Property columns that are not abundances keep the representative-value semantics.

## 1.2.1

### Patch Changes

- 4f99fa6: Migrate block onto the structurer (block-tools structure) and upgrade the SDK toolchain: workflow-tengo 6.6.1, tengo-builder 4.0.8, model/ui-vue 1.79.6, test 1.79.10. Replaces hand-maintained config (eslint) with the tool-managed layout (oxlint/oxfmt, ts-builder check). No functional changes.

## 1.2.0

### Minor Changes

- 02b09f9: Deal with empty results after ANARCI numbering

## 1.1.0

### Minor Changes

- 1d0b72a: IMGT, Kabat and Chothia numbering schemes added, dependencies updates
- ba2cf30: numbering schemas and dependencies updates
