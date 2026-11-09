---
"@platforma-open/milaboratories.redefine-clonotypes.model": patch
"@platforma-open/milaboratories.redefine-clonotypes.ui": patch
"@platforma-open/milaboratories.redefine-clonotypes.workflow": patch
---

Compute the block label without the UI

The trace label is now built by the workflow from the native labels of the chosen definition
columns, plus the numbering scheme and the top-clonotype cut when set, as
`Redefine Clonotypes (<columns>, <settings>)`. Opening the block no longer changes its arguments,
and a block that was never opened still gets a meaningful label. The subtitle shows the
result-pool labels of the chosen columns, refreshed when the user picks the definition, followed
by the same settings. Existing blocks show as stale once after the update.
