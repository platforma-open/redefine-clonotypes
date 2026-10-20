---
"@platforma-open/milaboratories.redefine-clonotypes": minor
"@platforma-open/milaboratories.redefine-clonotypes.kind": minor
"@platforma-open/milaboratories.redefine-clonotypes.model": minor
"@platforma-open/milaboratories.redefine-clonotypes.ui": minor
"@platforma-open/milaboratories.redefine-clonotypes.workflow": minor
---

Accept a subset filter (e.g. a Repertoire Labeling label or Lead Selection picks) with the clonotyping run. The dataset list offers the subsets of every chain (bulk) or receptor (single-cell) dataset of the run, built with buildDatasetOptions (requireEnrichments: false); run labels are unchanged.

A subset applies to its own chain or receptor only. That chain is cut to the subset's clonotypes before anything is computed: numbering, the new clonotype keys, the top-N ranking, the abundance fractions (now relative to the subset), the source counts and the cell linker all describe the subset. Chains without a subset are processed whole, exactly as on a run without one. Outputs of the subset chain have a trace rooted in the subset and carry pl7.app/inputSubset in their domain; outputs of the other chains are not stamped. Runs without a subset are unchanged.
