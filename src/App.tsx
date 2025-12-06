// ============================================================================
// App Component - Root application component
// ============================================================================

import { Component, onMount } from 'solid-js';
import { MainLayout } from './components/Layout';
import { historyStore } from './stores';

const App: Component = () => {
  onMount(async () => {
    // Initialize stores
    try {
      await historyStore.init();
      console.log('Smart Storage AI initialized');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  });

  return <MainLayout />;
};

export default App;
