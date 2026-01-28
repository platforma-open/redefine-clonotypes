import { getDefaultBlockLabel, model } from '@platforma-open/milaboratories.redefine-clonotypes.model';
import { defineApp } from '@platforma-sdk/ui-vue';
import { watchEffect } from 'vue';
import MainPage from './pages/MainPage.vue';

export const sdkPlugin = defineApp(model, (app) => {
  app.model.args.customBlockLabel ??= '';

  syncDefaultBlockLabel(app.model);

  return {
    progress: () => {
      return app.model.outputs.isRunning;
    },
    routes: {
      '/': () => MainPage,
    },
  };
});

export const useApp = sdkPlugin.useApp;

type AppModel = ReturnType<typeof useApp>['model'];

function syncDefaultBlockLabel(model: AppModel) {
  watchEffect(() => {
    const clonotypeDefinitionLabels = model.args.clonotypeDefinition
      .map((colId) => {
        const option = model.outputs.clonotypeDefinitionOptions
          ?.find((o) => o.value === colId);
        return option?.label || '';
      })
      .filter(Boolean);

    model.args.defaultBlockLabel = getDefaultBlockLabel({
      clonotypeDefinitionLabels,
    });
  });
}
