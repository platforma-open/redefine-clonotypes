---
'@platforma-open/milaboratories.redefine-clonotypes': minor
'@platforma-open/milaboratories.redefine-clonotypes.workflow': minor
'@platforma-open/milaboratories.redefine-clonotypes.model': minor
'@platforma-open/milaboratories.redefine-clonotypes.kind': minor
'@platforma-open/milaboratories.redefine-clonotypes.test': minor
'@platforma-open/milaboratories.redefine-clonotypes.ui': minor
---

Add an optional "Keep top clonotypes" setting: keep only the N redefined clonotypes with the highest total abundance, ranked by the primary abundance column summed across samples. The cut runs on the merged keys, so the retained count is exactly N whenever that many redefined clonotypes exist. Abundance fractions stay relative to the whole sample rather than to the retained subset, and the results panel reports the retained count whenever the cut removed anything. Leaving the field empty keeps every clonotype, so existing projects are unaffected.
