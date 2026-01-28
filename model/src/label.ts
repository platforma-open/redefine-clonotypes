export function getDefaultBlockLabel(data: {
  clonotypeDefinitionLabels: string[];
}) {
  const parts: string[] = [];

  if (data.clonotypeDefinitionLabels.length > 0) {
    // Join labels with dash, removing unnecessary words like "InFrame"
    const cleanLabels = data.clonotypeDefinitionLabels
      .map((label) => label.replace('InFrame', '').trim())
      .filter(Boolean);
    parts.push(cleanLabels.join('-'));
  }

  return parts.filter(Boolean).join(' ') || 'Select Clonotype Definition';
}
