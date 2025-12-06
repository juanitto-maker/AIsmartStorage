// ============================================================================
// MainLayout Component - Three-panel responsive layout
// ============================================================================

import { Component, createSignal, Show } from 'solid-js';
import { Header } from './Header';
import { FileTree } from '../FileTree';
import { PreviewPanel } from '../Preview';
import { ChatPanel } from '../Chat';
import { FolderIcon, LayoutIcon, MessageCircleIcon } from '../Common/Icons';
import { cn } from '../../utils/helpers';

type MobileTab = 'files' | 'preview' | 'chat';

export const MainLayout: Component = () => {
  const [mobileTab, setMobileTab] = createSignal<MobileTab>('files');
  const [leftPanelWidth, setLeftPanelWidth] = createSignal(320);
  const [rightPanelWidth, setRightPanelWidth] = createSignal(380);

  // Mobile tab navigation
  const MobileNav: Component = () => (
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 z-50">
      <div class="flex">
        <MobileNavButton
          icon={<FolderIcon size={20} />}
          label="Files"
          active={mobileTab() === 'files'}
          onClick={() => setMobileTab('files')}
        />
        <MobileNavButton
          icon={<LayoutIcon size={20} />}
          label="Preview"
          active={mobileTab() === 'preview'}
          onClick={() => setMobileTab('preview')}
        />
        <MobileNavButton
          icon={<MessageCircleIcon size={20} />}
          label="Chat"
          active={mobileTab() === 'chat'}
          onClick={() => setMobileTab('chat')}
        />
      </div>
    </div>
  );

  return (
    <div class="h-screen flex flex-col bg-dark-950 overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <div class="flex-1 flex overflow-hidden">
        {/* Desktop: Three-panel layout */}
        <div class="hidden md:flex flex-1">
          {/* Left panel: File browser */}
          <div
            class="flex-shrink-0 overflow-hidden"
            style={{ width: `${leftPanelWidth()}px` }}
          >
            <FileTree />
          </div>

          {/* Center panel: Preview (flexible) */}
          <div class="flex-1 flex flex-col overflow-hidden min-w-[300px]">
            <PreviewPanel />
          </div>

          {/* Right panel: Chat */}
          <div
            class="flex-shrink-0 overflow-hidden"
            style={{ width: `${rightPanelWidth()}px` }}
          >
            <ChatPanel />
          </div>
        </div>

        {/* Mobile: Single panel with tab navigation */}
        <div class="md:hidden flex-1 pb-16">
          <Show when={mobileTab() === 'files'}>
            <FileTree />
          </Show>
          <Show when={mobileTab() === 'preview'}>
            <PreviewPanel />
          </Show>
          <Show when={mobileTab() === 'chat'}>
            <ChatPanel />
          </Show>
        </div>
      </div>

      {/* Mobile navigation */}
      <MobileNav />
    </div>
  );
};

// Mobile navigation button
interface MobileNavButtonProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

const MobileNavButton: Component<MobileNavButtonProps> = (props) => (
  <button
    onClick={props.onClick}
    class={cn(
      'flex-1 flex flex-col items-center justify-center py-3 transition-colors',
      props.active
        ? 'text-accent-primary bg-accent-primary/10'
        : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
    )}
  >
    {props.icon}
    <span class="text-xs mt-1">{props.label}</span>
  </button>
);
