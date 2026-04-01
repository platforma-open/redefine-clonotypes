<script setup lang="ts">
import type { PlRef } from '@platforma-sdk/model';
import { PlAccordionSection, PlAlert, PlBlockPage, PlBtnGhost, PlDropdown, PlDropdownMulti, PlDropdownRef, PlLogView, PlMaskIcon24, PlSlideModal } from '@platforma-sdk/ui-vue';
import { computed, ref, watch, watchEffect } from 'vue';
import { useApp } from '../app';

const app = useApp();
const anarciLogOpen = ref(false);

const isValid = computed(() =>
  app.model.args.mixcrRunRef !== undefined
  && app.model.args.selectedChainRefs.length > 0
  && (app.model.args.clonotypeDefinition?.length ?? 0) > 0,
);

const numberingAvailable = computed(() => app.model.outputs.numberingAvailable === true);
const numberingDisabled = computed(() => app.model.args.selectedChainRefs.length === 0 || !numberingAvailable.value);

const showChainSelector = computed(() => (app.model.outputs.chainOptions?.length ?? 0) > 1);

const numberingSchemeOptions = [
  { label: 'IMGT', value: 'imgt' },
  { label: 'Kabat', value: 'kabat' },
  { label: 'Chothia', value: 'chothia' },
];

// Reset numbering scheme when run is cleared or numbering becomes unavailable
watchEffect(() => {
  if (app.model.args.mixcrRunRef === undefined || app.model.outputs.numberingAvailable === false) {
    app.model.args.numberingScheme = undefined;
  }
});

// Stable fingerprint of chain options to detect real changes (not re-renders)
const chainOptionsKey = computed(() => {
  const options = app.model.outputs.chainOptions;
  if (!options || options.length === 0) return '';
  return options.map((opt) => opt.label).join('\0');
});

// Auto-select all chains when the available options actually change
watch(chainOptionsKey, () => {
  const options = app.model.outputs.chainOptions;
  if (options && options.length > 0) {
    app.model.args.selectedChainRefs = options.map((opt) => opt.value);
  }
}, { immediate: true });

function setMixcrRun(newRef: PlRef | undefined) {
  app.model.args.mixcrRunRef = newRef;
  app.model.args.selectedChainRefs = [];
  app.model.args.numberingScheme = undefined;
  app.model.args.clonotypeDefinition = [];
}

// Per-chain labels for display (from chainOptions)
const chainLabels = computed(() => {
  const options = app.model.outputs.chainOptions;
  if (!options) return [];
  return app.model.args.selectedChainRefs.map((ref) => {
    const opt = options.find((o) => JSON.stringify(o.value) === JSON.stringify(ref));
    return opt?.label ?? `Chain ${app.model.args.selectedChainRefs.indexOf(ref) + 1}`;
  });
});

const hasAnyAnarciLog = computed(() =>
  app.model.outputs.perChainAnarciLog?.some((log) => log != null) ?? false,
);

function numberingWarningForChain(ns: { total: number; numbered: number } | undefined) {
  if (!ns) return undefined;
  if (ns.numbered === 0) {
    return `ANARCI could not number any of the ${ns.total.toLocaleString()} clonotypes. The framework regions may be too divergent from known germline sequences.`;
  }
  if (ns.numbered < ns.total * 0.5) {
    return `ANARCI could only number ${ns.numbered.toLocaleString()} of ${ns.total.toLocaleString()} clonotypes. The framework regions may be divergent from known germline sequences. Unnumbered clonotypes are excluded from the output.`;
  }
  return undefined;
}

</script>

<template>
  <PlBlockPage
    v-model:subtitle="app.model.args.customBlockLabel"
    :subtitle-placeholder="app.model.args.defaultBlockLabel"
    title="Redefine Clonotypes"
  >
    <PlDropdownRef
      v-model="app.model.args.mixcrRunRef"
      label="MiXCR Run"
      :options="app.model.outputs.mixcrRunOptions"
      @update:model-value="setMixcrRun"
    />

    <PlDropdownMulti
      v-if="showChainSelector"
      v-model="app.model.args.selectedChainRefs"
      label="Select Chains"
      :options="app.model.outputs.chainOptions"
      :disabled="!app.model.args.mixcrRunRef"
    />

    <PlDropdownMulti
      v-model="app.model.args.clonotypeDefinition"
      label="New clonotype definition"
      :options="app.model.outputs.clonotypeDefinitionOptions"
      :disabled="app.model.args.selectedChainRefs.length === 0"
    >
      <template v-if="showChainSelector" #tooltip>
        In single-cell data, both chains (A and B) will be redefined using the same selected features.
      </template>
    </PlDropdownMulti>
    <PlAccordionSection v-if="numberingAvailable" label="Advanced Settings">
      <PlDropdown
        v-model="app.model.args.numberingScheme"
        label="Numbering schema"
        placeholder="None"
        :options="numberingSchemeOptions"
        :disabled="numberingDisabled"
        :clearable="true"
      >
        <template #tooltip>
          Apply IMGT, Kabat, or Chothia numbering. Requires datasets with VDJRegion or VDJRegionInFrame sequences or assembled on CDR3 (In this case, only the CDR3 region will be numbered). Transformed features are used for clonotype definition.
        </template>
      </PlDropdown>
    </PlAccordionSection>

    <PlAlert v-if="!isValid" type="info">
      Please select a MiXCR run, chains, and a new clonotype definition.
    </PlAlert>
    <template v-else-if="!app.model.outputs.isRunning">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h3 style="margin: 0;">Results</h3>
        <PlBtnGhost v-if="hasAnyAnarciLog" @click.stop="() => (anarciLogOpen = true)">
          ANARCI Log
          <template #append>
            <PlMaskIcon24 name="file-logs" />
          </template>
        </PlBtnGhost>
      </div>

      <div v-for="(stats, chainIdx) in app.model.outputs.perChainStats" :key="chainIdx" class="results">
        <h4 v-if="chainLabels.length > 1" style="margin: 0 0 4px 0;">{{ chainLabels[chainIdx] }}</h4>
        <PlAlert v-if="stats && stats.nClonotypesBefore === 0" type="warn">
          The input dataset is empty. Please choose a different dataset.
        </PlAlert>
        <PlAlert v-if="numberingWarningForChain(app.model.outputs.perChainNumberingStats?.[chainIdx])" type="warn">
          {{ numberingWarningForChain(app.model.outputs.perChainNumberingStats?.[chainIdx]) }}
        </PlAlert>
        <p>Input clonotypes: {{ stats?.nClonotypesBefore?.toLocaleString() ?? 'N/A' }}</p>
        <p v-if="app.model.args.numberingScheme !== undefined">Successfully numbered: {{ app.model.outputs.perChainNumberingStats?.[chainIdx]?.numbered?.toLocaleString() ?? 'N/A' }}</p>
        <p>Output clonotypes after redefinition: {{ stats?.nClonotypesAfter?.toLocaleString() ?? 'N/A' }}</p>
      </div>
    </template>
    <PlSlideModal v-model="anarciLogOpen" width="80%">
      <template #title>ANARCI Log</template>
      <template v-for="(log, chainIdx) in app.model.outputs.perChainAnarciLog" :key="chainIdx">
        <h4 v-if="chainLabels.length > 1" style="margin: 0; padding: 16px 16px 0;">{{ chainLabels[chainIdx] }}</h4>
        <pre v-if="app.model.outputs.perChainNumberingStats?.[chainIdx]?.unnumberedSamples?.length" style="margin: 0; padding: 16px; font-size: 12px; white-space: pre-wrap; word-break: break-all; border-bottom: 1px solid var(--pl-color-border, #ddd);">Sample of un-numbered sequences ({{ app.model.outputs.perChainNumberingStats[chainIdx].unnumberedSamples.length }}):

<template v-for="(sample, idx) in app.model.outputs.perChainNumberingStats[chainIdx].unnumberedSamples" :key="idx">{{ sample }}
</template></pre>
        <PlLogView v-if="log" :log-handle="log"/>
      </template>
    </PlSlideModal>
  </PlBlockPage>
</template>
