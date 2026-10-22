---
"@platforma-open/milaboratories.redefine-clonotypes": patch
"@platforma-open/milaboratories.redefine-clonotypes.workflow": patch
---

Size the main clonotype-redefinition step from its input volume with a 32 GiB floor, instead of a flat 32 GiB that was OOM-killed on large datasets. Raise the TSV exports from 24 GiB / 2 cores and the p-frame imports from 8 GiB / 2 cores to 32 GiB / 4 cores, which cuts both steps several-fold on large datasets.
