<script setup lang="ts">
import type { PlRef } from '@platforma-sdk/model';
import { PlAlert, PlBlockPage, PlDropdown, PlDropdownMulti, PlDropdownRef } from '@platforma-sdk/ui-vue';
import { computed, watch } from 'vue';
import { useApp } from '../app';

const app = useApp();

const isValid = computed(() =>
  app.model.args.mixcrRun !== undefined
  && app.model.args.selectedChains.length > 0
  && (app.model.args.clonotypeDefinition?.length ?? 0) > 0,
);

const numberingAvailable = computed(() => app.model.outputs.numberingAvailable === true);
const numberingDisabled = computed(() => app.model.args.selectedChains.length === 0 || !numberingAvailable.value);

const numberingSchemeOptions = [
  { label: 'IMGT', value: 'imgt' },
  { label: 'Kabat', value: 'kabat' },
  { label: 'Chothia', value: 'chothia' },
];

watch(() => app.model.args.mixcrRun, (newVal, oldVal) => {
  if (newVal === undefined) {
    app.model.args.selectedChains = [];
    app.model.args.numberingScheme = undefined;
    app.model.args.clonotypeDefinition = [];
  } else if (newVal !== oldVal) {
    // Clear chains when run changes
    app.model.args.selectedChains = [];
    app.model.args.numberingScheme = undefined;
    app.model.args.clonotypeDefinition = [];
  }
});

// Auto-select chains when options become available and none are selected
watch(() => app.model.outputs.chainOptions, (newOptions) => {
  if (newOptions && newOptions.length > 0 && app.model.args.selectedChains.length === 0) {
    app.model.args.selectedChains = newOptions.map((opt) => opt.value);
  }
});

function setMixcrRun(ref: PlRef | undefined) {
  app.model.args.mixcrRun = ref;
}
</script>

<template>
  <PlBlockPage
    v-model:subtitle="app.model.args.customBlockLabel"
    :subtitle-placeholder="app.model.args.defaultBlockLabel"
    title="Redefine Clonotypes"
  >
    <PlDropdownRef
      v-model="app.model.args.mixcrRun"
      label="MiXCR Run"
      :options="app.model.outputs.mixcrRunOptions"
      @update:model-value="setMixcrRun"
    />

    <PlDropdownMulti
      v-model="app.model.args.selectedChains"
      label="Select Chains"
      :options="app.model.outputs.chainOptions"
      :disabled="!app.model.args.mixcrRun"
    />

    <PlDropdownMulti
      v-model="app.model.args.clonotypeDefinition"
      label="New clonotype definition"
      :options="app.model.outputs.clonotypeDefinitionOptions"
      :disabled="app.model.args.selectedChains.length === 0"
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
        Apply IMGT, Kabat, or Chothia numbering to sequences. This option is available if the input dataset contains assembling VDJRegion or main CDR3 sequences.
        <br /><br />
        When enabled:
        <br />
        • Clonotypes are grouped by gapped/aligned sequences (VDJRegions) or by original sequences (all other features).
        <br />
        • Output CDR3 sequences will be trimmed (anchor residues removed), while all other sequence features will be displayed as gapped/aligned sequences according to the selected scheme.
      </template>
    </PlDropdown>

    <PlAlert v-if="!isValid" type="info">
      Please select a MiXCR run, chains, and a new clonotype definition.
    </PlAlert>
    <div v-else-if="isValid && !app.model.outputs.isRunning" class="results">
      <h3>Results</h3>
      <p>Number of clonotypes before: {{ app.model.outputs.stats?.nClonotypesBefore?.toLocaleString() ?? 'N/A' }}</p>
      <p>Number of clonotypes after: {{ app.model.outputs.stats?.nClonotypesAfter?.toLocaleString() ?? 'N/A' }}</p>
    </div>
  </PlBlockPage>
</template>
