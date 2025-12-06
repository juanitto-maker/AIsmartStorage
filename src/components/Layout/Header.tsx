// ============================================================================
// Header Component - App header with branding and controls
// ============================================================================

import { Component } from 'solid-js';
import { SparklesIcon, SettingsIcon, HardDriveIcon } from '../Common/Icons';

export const Header: Component = () => {
  return (
    <header class="flex-shrink-0 h-14 bg-dark-900 border-b border-dark-700 flex items-center justify-between px-4">
      {/* Logo and title */}
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center shadow-lg">
          <SparklesIcon size={20} class="text-white" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-dark-100 leading-tight">
            Smart Storage AI
          </h1>
          <p class="text-xs text-dark-500 leading-tight">
            Privacy-first file organizer
          </p>
        </div>
      </div>

      {/* Center: Privacy badge */}
      <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-full border border-dark-700">
        <span class="w-2 h-2 bg-accent-success rounded-full animate-pulse" />
        <span class="text-xs text-dark-300">100% Local</span>
        <span class="text-xs text-dark-500">|</span>
        <span class="text-xs text-dark-300">Zero Network</span>
      </div>

      {/* Right: Actions */}
      <div class="flex items-center gap-2">
        <button
          class="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-dark-200 transition-colors"
          title="Settings"
        >
          <SettingsIcon size={20} />
        </button>
      </div>
    </header>
  );
};
