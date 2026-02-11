<script setup lang="ts">
import type { PlRef } from '@platforma-sdk/model';
import { PlAlert, PlBlockPage, PlCheckbox, PlDropdown, PlDropdownMulti, PlDropdownRef } from '@platforma-sdk/ui-vue';
import { computed, watchEffect } from 'vue';
import { useApp } from '../app';

const app = useApp();
const args = app.model.args as typeof app.model.args & { exportKabatCdr3AaPositions?: boolean };

const isValid = computed(() => args.anchorRef !== undefined && (args.clonotypeDefinition?.length ?? 0) > 0);
const numberingAvailable = computed(() => app.model.outputs.numberingAvailable === true);
const numberingDisabled = computed(() => !args.anchorRef || !numberingAvailable.value);
const numberingSchemeOptions = [
  { label: 'IMGT', value: 'imgt' },
  { label: 'Kabat', value: 'kabat' },
  { label: 'Chothia', value: 'chothia' },
];
const isKabat = computed(() => args.numberingScheme === 'kabat');
const exportKabatCdr3AaPositions = computed({
  get: () => args.exportKabatCdr3AaPositions ?? false,
  set: (value: boolean) => {
    args.exportKabatCdr3AaPositions = value;
  },
});

// Auto-derive default label whenever clonotype definition changes
watchEffect(() => {
  const parts: string[] = [];

  if (args.clonotypeDefinition?.length) {
    // Get short labels from the definition columns
    const labels = args.clonotypeDefinition
      .map((colId) => {
        const options = app.model.outputs.clonotypeDefinitionOptions ?? [];
        const option = options.find((o: { value: string; label: string }) => o.value === colId);
        // Extract short label, remove unnecessary words
        let label = option?.label || '';
        label = label.replace('InFrame', '').trim();
        return label;
      })
      .filter(Boolean);

    parts.push(labels.join('-'));
  }

  args.defaultBlockLabel = parts.filter(Boolean).join(' ') || 'Select Clonotype Definition';
});

watchEffect(() => {
  if (app.model.args.anchorRef === undefined) {
    args.numberingScheme = undefined;
  }
});
watchEffect(() => {
  if (!isKabat.value) {
    exportKabatCdr3AaPositions.value = false;
  }
});

function setDataset(ref: PlRef | undefined) {
  args.anchorRef = ref;
}
</script>

<template>
  <PlBlockPage
    v-model:subtitle="args.customBlockLabel"
    :subtitle-placeholder="args.defaultBlockLabel"
    title="Redefine Clonotypes"
  >
    <PlDropdownRef
      v-model="args.anchorRef"
      label="VDJ dataset"
      :options="app.model.outputs.datasetOptions"
      @update:model-value="setDataset"
    />
    <PlDropdownMulti
      v-model="args.clonotypeDefinition"
      label="New clonotype definition"
      :options="app.model.outputs.clonotypeDefinitionOptions"
      :disabled="!args.anchorRef"
    />
    <PlDropdown
      v-model="args.numberingScheme"
      label="Numbering schema"
      placeholder="None"
      :options="numberingSchemeOptions"
      :disabled="numberingDisabled"
      :clearable="true"
    >
      <template #tooltip>
        Apply IMGT, Kabat, or Chothia numbering. Available only for datasets with VDJRegion or VDJRegionInFrame features. Transformed features are used for clonotype definition.
      </template>
    </PlDropdown>
    <PlCheckbox
      v-if="isKabat"
      v-model="exportKabatCdr3AaPositions"
      :disabled="numberingDisabled"
    >
      Export Kabat CDR3 AA position table
    </PlCheckbox>

    <PlAlert v-if="!isValid" type="info">
      Please select a VDJ dataset and a new clonotype definition.
    </PlAlert>
    <div v-else-if="isValid && !app.model.outputs.isRunning" class="results">
      <h3>Results</h3>
      <p>Number of clonotypes before: {{ app.model.outputs.stats?.nClonotypesBefore?.toLocaleString() ?? 'N/A' }}</p>
      <p>Number of clonotypes after: {{ app.model.outputs.stats?.nClonotypesAfter?.toLocaleString() ?? 'N/A' }}</p>
    </div>
  </PlBlockPage>
</template>
