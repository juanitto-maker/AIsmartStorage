// ============================================================================
// App Component - Root application component
// ============================================================================

import { Component, onMount } from 'solid-js';
import { MainLayout } from './components/Layout';
import { ModelDownloadModal } from './components/ModelDownload';
import { historyStore, modelStore } from './stores';

const App: Component = () => {
  onMount(async () => {
    // Initialize stores
    try {
      // Initialize model store first (check if AI model exists)
      await modelStore.init();

      // Initialize history store
      await historyStore.init();

      console.log('Smart Storage AI initialized');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  });

  return (
    <>
      <MainLayout />
      <ModelDownloadModal />
    </>
  );
};

export default App;
