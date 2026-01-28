<script setup lang="ts">
import type { PlRef } from '@platforma-sdk/model';
import { PlAlert, PlBlockPage, PlDropdownMulti, PlDropdownRef } from '@platforma-sdk/ui-vue';
import { computed } from 'vue';
import { useApp } from '../app';

const app = useApp();

const isValid = computed(() => app.model.args.anchorRef !== undefined && (app.model.args.clonotypeDefinition?.length ?? 0) > 0);
const numberingAvailable = computed(() => app.model.outputs.numberingAvailable === true);
const numberingDisabled = computed(() => !app.model.args.anchorRef || !numberingAvailable.value);
const numberingSchemeOptions = [
  { label: 'IMGT', value: 'imgt' },
  { label: 'Kabat', value: 'kabat' },
  { label: 'Chothia', value: 'chothia' },
];

function setDataset(ref: PlRef | undefined) {
  app.model.args.anchorRef = ref;
}
</script>

<template>
  <PlBlockPage
    v-model:subtitle="app.model.args.customBlockLabel"
    :subtitle-placeholder="app.model.args.defaultBlockLabel"
    title="Redefine Clonotypes"
  >
    <PlDropdownRef
      v-model="app.model.args.anchorRef"
      label="VDJ dataset"
      :options="app.model.outputs.datasetOptions"
      @update:model-value="setDataset"
    />
    <PlDropdownMulti
      v-model="app.model.args.clonotypeDefinition"
      label="New clonotype definition"
      :options="app.model.outputs.clonotypeDefinitionOptions"
      :disabled="!app.model.args.anchorRef"
    />
    <PlDropdown
      v-model="app.model.args.numberingScheme"
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
