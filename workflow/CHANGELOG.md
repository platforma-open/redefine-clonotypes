# @platforma-open/milaboratories.redefine-clonotypes.workflow

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
