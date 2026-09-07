---
'@platforma-open/milaboratories.redefine-clonotypes': patch
---

Fix the kind refusing the column ids the block itself writes. `clonotypeDefinition` holds ids minted by `resultPool.getCanonicalOptions`, which are *anchored* keys; `isColumnUniversalId` recognizes only the newer key forms and rejects those, so applying a template exported from this block failed with "'clonotypeDefinition' must be an array of column ids." Both forms are now accepted, matching what `clonotype-clustering`, `clonotype-enrichment` and `clonotype-space` already do.
