---
"@platforma-open/milaboratories.redefine-clonotypes": patch
"@platforma-open/milaboratories.redefine-clonotypes.workflow": patch
---

Size the main clonotype-redefinition step from its input volume with a 32 GiB floor, instead of a flat 32 GiB that was OOM-killed on large datasets. Upgrade workflow-tengo to 6.16.0.
