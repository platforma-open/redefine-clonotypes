# Redefine Clonotypes

This block allows you to change the definition of a clonotype in a VDJ dataset. You can select a new set of columns (like V gene, J gene, and CDR3 aa or nt sequence) to define a clonotype.

The block will then:

1. Group the original clonotypes based on your new definition.
2. For each new group, it selects the original clonotype with the highest abundance as the representative.
3. It recalculates all abundance columns by summing up the values from the original clonotypes within each group.
4. It outputs a new VDJ dataset with the redefined clonotypes and their new abundances.

This is useful when you want to analyze your data with a different granularity, for example, by ignoring the V gene allele or by defining a clonotype purely by its CDR3 sequence.
