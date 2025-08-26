<script setup lang="ts">
import type { PlRef } from '@platforma-sdk/model';
import { plRefsEqual } from '@platforma-sdk/model';
import { PlAlert, PlBlockPage, PlDropdownMulti, PlDropdownRef } from '@platforma-sdk/ui-vue';
import { computed } from 'vue';
import { useApp } from '../app';

const app = useApp();

const isValid = computed(() => app.model.args.anchorRef !== undefined && (app.model.args.clonotypeDefinition?.length ?? 0) > 0);

function setDataset(ref: PlRef | undefined) {
  app.model.args.anchorRef = ref;
  app.model.ui.title = 'Redefine Clonotypes - ' + (ref
    ? app.model.outputs.datasetOptions?.find((o) =>
      plRefsEqual(o.ref, ref),
    )?.label
    : '');
}
</script>

<template>
  <PlBlockPage>
    <template #title>{{ app.model.ui.title }}</template>
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

    <PlAlert v-if="!isValid" type="info">
      Please select a VDJ dataset and a new clonotype definition.
    </PlAlert>
    <PlAlert v-else-if="app.model.outputs.isRunning" type="info">
      Running...
    </PlAlert>
    <div v-else class="results">
      <h3>Results</h3>
      <p>Number of clonotypes before: {{ app.model.outputs.stats?.nClonotypesBefore?.toLocaleString() ?? 'N/A' }}</p>
      <p>Number of clonotypes after: {{ app.model.outputs.stats?.nClonotypesAfter?.toLocaleString() ?? 'N/A' }}</p>
    </div>
  </PlBlockPage>
</template>
