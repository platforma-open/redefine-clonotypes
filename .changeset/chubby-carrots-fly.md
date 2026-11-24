---
"@platforma-open/milaboratories.redefine-clonotypes.workflow": minor
"@platforma-open/milaboratories.redefine-clonotypes": minor
"@platforma-open/milaboratories.redefine-clonotypes.model": minor
"@platforma-open/milaboratories.redefine-clonotypes.kind": minor
"@platforma-open/milaboratories.redefine-clonotypes.test": minor
"@platforma-open/milaboratories.redefine-clonotypes.ui": minor
---

Results already computed are reused instead of being computed again:

- Changing only **Keep top clonotypes** now selects the top clonotypes again without redoing the grouping, even weeks after the last run.
- A second block with the same settings, or the same data in another project, reuses the existing results, numbering included.

Updating re-runs the block once.
