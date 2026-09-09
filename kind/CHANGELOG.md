# @platforma-open/milaboratories.redefine-clonotypes.kind

## 1.1.0

### Minor Changes

- adc1f4a: Add an optional "Keep top clonotypes" setting: keep only the N redefined clonotypes with the highest total abundance, ranked by the primary abundance column summed across samples. The cut runs on the merged keys, so the retained count is exactly N whenever that many redefined clonotypes exist. Abundance fractions stay relative to the whole sample rather than to the retained subset, and the results panel reports the retained count whenever the cut removed anything. Leaving the field empty keeps every clonotype, so existing projects are unaffected.

## 1.0.1

### Patch Changes

- 50066d5: Bump the kind version. The previous release widened the kind's column-id check without bumping it, and the registry refuses that: a kind version's content is immutable, so publishing 1.0.0 with a different `sourceHash` hard-fails and takes the whole block publish with it.
