<script setup lang="ts">
import { PlAlert, PlBlockPage, PlBtnGhost, PlDropdown, PlDropdownMulti, PlDropdownRef, PlLogView, PlMaskIcon24, PlSlideModal } from '@platforma-sdk/ui-vue';
import { computed, ref, watchEffect } from 'vue';
import { useApp } from '../app';

const app = useApp();
const anarciLogOpen = ref(false);

const isValid = computed(() => app.model.args.anchorRef !== undefined && (app.model.args.clonotypeDefinition?.length ?? 0) > 0);
const numberingAvailable = computed(() => app.model.outputs.numberingAvailable === true);
const numberingDisabled = computed(() => !app.model.args.anchorRef || !numberingAvailable.value);
const numberingSchemeOptions = [
  { label: 'IMGT', value: 'imgt' },
  { label: 'Kabat', value: 'kabat' },
  { label: 'Chothia', value: 'chothia' },
];

watchEffect(() => {
  // Reset scheme when dataset is cleared OR when the selected dataset does not support numbering.
  // Strict === false avoids clearing while the output is still loading (undefined).
  if (app.model.args.anchorRef === undefined || app.model.outputs.numberingAvailable === false) {
    app.model.args.numberingScheme = undefined;
  }
});

const inputIsEmpty = computed(() => {
  const stats = app.model.outputs.stats;
  return stats !== undefined && stats.nClonotypesBefore === 0;
});

// Derive the warning message from numberingStats in the UI layer; the model provides raw facts.
const numberingWarning = computed(() => {
  const ns = app.model.outputs.numberingStats;
  if (!ns) return undefined;
  if (ns.numbered === 0) {
    return `ANARCI could not number any of the ${ns.total.toLocaleString()} clonotypes. The framework regions may be too divergent from known germline sequences.`;
  }
  if (ns.numbered < ns.total * 0.5) {
    return `ANARCI could only number ${ns.numbered.toLocaleString()} of ${ns.total.toLocaleString()} clonotypes. The framework regions may be divergent from known germline sequences. Unnumbered clonotypes are excluded from the output.`;
  }
  return undefined;
});

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
    <template v-else-if="!app.model.outputs.isRunning">
      <PlAlert v-if="numberingWarning" type="warn">
        {{ numberingWarning }}
      </PlAlert>
      <div class="results">
        <PlAlert v-if="inputIsEmpty" type="warn">
          The input dataset you have selected is empty. Please choose a different dataset.
        </PlAlert>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="margin: 0;">Results</h3>
          <PlBtnGhost v-if="app.model.outputs.anarciLog" @click.stop="() => (anarciLogOpen = true)">
            ANARCI Log
            <template #append>
              <PlMaskIcon24 name="file-logs" />
            </template>
          </PlBtnGhost>
        </div>
        <p>Input clonotypes: {{ app.model.outputs.stats?.nClonotypesBefore?.toLocaleString() ?? 'N/A' }}</p>
        <p v-if="app.model.args.numberingScheme !== undefined">Succesfully numbered: {{ app.model.outputs.numberingStats?.numbered?.toLocaleString() ?? 'N/A' }}</p>
        <p>Output clonotypes after redefinition: {{ app.model.outputs.stats?.nClonotypesAfter?.toLocaleString() ?? 'N/A' }}</p>
      </div>
    </template>
    <PlSlideModal v-model="anarciLogOpen" width="80%">
      <template #title>ANARCI Log</template>
      <pre v-if="app.model.outputs.numberingStats?.unnumberedSamples?.length" style="margin: 0; padding: 16px; font-size: 12px; white-space: pre-wrap; word-break: break-all; border-bottom: 1px solid var(--pl-color-border, #ddd);">Sample of un-numbered sequences ({{ app.model.outputs.numberingStats.unnumberedSamples.length }}):

<template v-for="(sample, idx) in app.model.outputs.numberingStats.unnumberedSamples" :key="idx">{{ sample }}
</template></pre>
      <PlLogView :log-handle="app.model.outputs.anarciLog"/>
    </PlSlideModal>
  </PlBlockPage>
</template>
