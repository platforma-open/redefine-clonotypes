<script setup lang="ts">
import type { PlRef } from '@platforma-sdk/model';
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
  if (app.model.args.anchorRef === undefined) {
    app.model.args.numberingScheme = undefined;
  }
});

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
    <template v-else-if="isValid && !app.model.outputs.isRunning">
      <PlAlert v-if="app.model.outputs.numberingWarning" type="warn">
        {{ app.model.outputs.numberingWarning }}
      </PlAlert>
      <div class="results">
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
