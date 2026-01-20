import { model } from '@platforma-open/milaboratories.redefine-clonotypes.model';
import { defineApp } from '@platforma-sdk/ui-vue';
import { watch } from 'vue';
import MainPage from './pages/MainPage.vue';

export const sdkPlugin = defineApp(model, (app) => {
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

// Make sure labels are initialized
const unwatch = watch(sdkPlugin, ({ loaded }) => {
  if (!loaded) return;
  const app = useApp();
  app.model.args.customBlockLabel ??= '';
  app.model.args.defaultBlockLabel ??= 'Select Clonotype Definition';
  unwatch();
});
