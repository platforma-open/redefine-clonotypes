# Redefine Clonotypes

Change what counts as a clonotype, without re-running clonotyping. This Platforma block re-groups an existing V(D)J dataset by a definition you choose — any combination of V gene, J gene, and CDR3 sequence — picks a representative for each new group, and recalculates every abundance column by summing across the members.

Open-source analysis block for Platforma, the biologics discovery platform by MiLaboratories. For the full no-code workflow, see [platforma.bio](https://platforma.bio/).

## What it does

"Clonotype" is a choice, not a fact. Two sequences with the same CDR3 but different V gene alleles are one clonotype under some definitions and two under others, and which definition is right depends on the question — an allele-level distinction that matters for lineage work is noise when comparing CDR3 usage across cohorts.

Normally changing that definition means re-running clonotyping. This block changes it in place instead. Pick the columns that should define a clonotype — V gene, J gene, CDR3 amino acid or nucleotide sequence, in any combination — and the block:

1. Groups the existing clonotypes by that definition.
2. Selects the most abundant original clonotype in each group as its representative.
3. Recalculates every abundance column by summing the members' values.
4. Emits a new V(D)J dataset with the redefined clonotypes and their combined abundances.

The output is a normal V(D)J dataset, so everything downstream works on it exactly as it would on the original — at the granularity you chose.

Region definitions depend on a numbering scheme, so you select IMGT, Kabat, or Chothia. Numbering is applied with ANARCI when the input carries assembled variable domains, with a lighter path for CDR3-only inputs.

## Inputs & outputs

* **Input:** a V(D)J clonotype dataset, plus the set of columns that should define a clonotype and the chains to include.
* **Output:** a new V(D)J dataset whose clonotypes follow your definition, each represented by its most abundant original member, with all abundance columns recalculated as group sums. Optionally only the most abundant N of them.

## Specifications

| | |
|---|---|
| Block title in app | Redefine Clonotypes |
| Definition columns | Any combination of V gene, J gene, and CDR3 amino acid or nucleotide sequence |
| Representative | The most abundant original clonotype in each new group |
| Abundances | Recalculated as the sum across group members, for every abundance column |
| Numbering schemes | IMGT, Kabat, Chothia — via [ANARCI](https://github.com/oxpig/ANARCI) for assembled domains |
| Chain selection | Choose which chains to include |
| Top clonotypes | Optional: keep only the N most abundant redefined clonotypes, per selected chain |
| Output | A standard V(D)J dataset, usable by any downstream block |

## Use cases

* **Ignore allele-level distinctions:** collapse clonotypes that differ only by V gene allele when the allele is not the question.
* **CDR3-only clonotypes:** define a clonotype purely by its CDR3 sequence, for cross-cohort or cross-study comparison.
* **Amino acid instead of nucleotide:** merge clonotypes that are synonymous at the protein level.
* **Change granularity without reprocessing:** try a coarser or finer definition without re-running clonotyping from raw reads.
* **Match an external convention:** align your clonotype definition with a published study or a collaborator's pipeline.
* **Reduce fragmentation:** combine clonotypes split by a distinction that is below your detection confidence, so abundances reflect the real clone size.

## FAQ

### Why would I redefine clonotypes?

Because the right definition depends on the analysis. A lineage study may need allele-level resolution; a cross-cohort comparison of CDR3 usage should ignore it. Rather than committing to one definition at clonotyping time, this block lets you produce the granularity each analysis needs.

### Do I have to re-run clonotyping?

No — that is the point. The block re-groups an existing dataset, which is far faster than reprocessing raw reads, and lets you keep several definitions of the same data side by side.

### How are abundances handled?

Every abundance column is recalculated as the sum over the members of each new group, so a redefined clonotype's abundance is the combined abundance of the original clonotypes that merged into it. Nothing is double-counted, and nothing is dropped unless you ask for it: setting "Keep top clonotypes" discards everything below the cut. Fractions stay relative to the whole sample either way, so after a cut they no longer sum to 1.

### Which original clonotype represents each new group?

The most abundant one. Its sequence and annotations carry through as the group's representative, while the abundances reflect the whole group.

### Why does the numbering scheme matter?

Because IMGT, Kabat, and Chothia draw region boundaries differently, so which residues count as CDR3 depends on the scheme. Selecting the one your data and conventions use keeps the definition consistent.

### Can I use the output like a normal dataset?

Yes. The output is a standard V(D)J dataset — clustering, enrichment, developability, lead selection, and everything else consume it exactly as they would the original.

## Citation

Numbering uses ANARCI. If you use this block in your research, please cite:

> Dunbar, J., & Deane, C. M. (2016). ANARCI: antigen receptor numbering and receptor classification. *Bioinformatics* **32**(2), 298–300. [https://doi.org/10.1093/bioinformatics/btv552](https://doi.org/10.1093/bioinformatics/btv552)

## Part of the Platforma ecosystem

This block is part of [Platforma](https://platforma.bio/) by [MiLaboratories](https://github.com/milaboratory), using [ANARCI](https://github.com/oxpig/ANARCI) for residue numbering. Explore the other open-source blocks at [github.com/platforma-open](https://github.com/platforma-open) and the docs for V(D)J analysis at [docs.platforma.bio/biology-guides/vdj-analysis](https://docs.platforma.bio/biology-guides/vdj-analysis/).
