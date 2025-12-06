// ============================================================================
// MainLayout Component - Two-column responsive layout with resizable panels
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

  // Panel sizes (percentages)
  const [leftColumnWidth, setLeftColumnWidth] = createSignal(50);
  const [filesHeight, setFilesHeight] = createSignal(60);

  // Drag state stored in a mutable object (not reactive, just for tracking)
  const dragState = {
    type: 'none' as 'none' | 'vertical' | 'horizontal',
    containerRect: null as DOMRect | null,
    leftColumnRect: null as DOMRect | null,
  };

  // Force re-render for drag visual feedback
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragDirection, setDragDirection] = createSignal<'none' | 'vertical' | 'horizontal'>('none');

  const startVerticalDrag = (e: MouseEvent) => {
    e.preventDefault();
    // Use currentTarget (the element with the listener) and get its parent (the main flex container)
    const container = (e.currentTarget as HTMLElement).parentElement;
    if (container) {
      dragState.type = 'vertical';
      dragState.containerRect = container.getBoundingClientRect();
      setIsDragging(true);
      setDragDirection('vertical');

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const startHorizontalDrag = (e: MouseEvent) => {
    e.preventDefault();
    // Use currentTarget (the element with the listener) and get its parent (the left column)
    const leftColumn = (e.currentTarget as HTMLElement).parentElement;
    if (leftColumn) {
      dragState.type = 'horizontal';
      dragState.leftColumnRect = leftColumn.getBoundingClientRect();
      setIsDragging(true);
      setDragDirection('horizontal');

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragState.type === 'vertical' && dragState.containerRect) {
      const rect = dragState.containerRect;
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftColumnWidth(Math.max(25, Math.min(75, percentage)));
    }

    if (dragState.type === 'horizontal' && dragState.leftColumnRect) {
      const rect = dragState.leftColumnRect;
      const percentage = ((e.clientY - rect.top) / rect.height) * 100;
      setFilesHeight(Math.max(20, Math.min(80, percentage)));
    }
  };

  const handleMouseUp = () => {
    dragState.type = 'none';
    dragState.containerRect = null;
    dragState.leftColumnRect = null;
    setIsDragging(false);
    setDragDirection('none');

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

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
        {/* Desktop: Two-column layout */}
        <div
          class={cn(
            "hidden md:flex flex-1",
            isDragging() && "select-none"
          )}
          style={{
            cursor: dragDirection() === 'vertical' ? 'col-resize' :
                   dragDirection() === 'horizontal' ? 'row-resize' : 'auto'
          }}
        >
          {/* Left column: Files + Preview (stacked) */}
          <div
            class="flex flex-col overflow-hidden"
            style={{ width: `${leftColumnWidth()}%` }}
          >
            {/* Files panel (top) */}
            <div
              class="overflow-hidden"
              style={{ height: `${filesHeight()}%` }}
            >
              <FileTree />
            </div>

            {/* Horizontal resize handle */}
            <div
              class={cn(
                "h-1 bg-dark-700 cursor-row-resize transition-colors flex-shrink-0 flex items-center justify-center group hover:bg-accent-primary/50",
                dragDirection() === 'horizontal' && "bg-accent-primary"
              )}
              onMouseDown={startHorizontalDrag}
            >
              <div class={cn(
                "w-8 h-0.5 bg-dark-500 rounded-full group-hover:bg-white/50",
                dragDirection() === 'horizontal' && "bg-white"
              )} />
            </div>

            {/* Preview panel (bottom) */}
            <div class="flex-1 overflow-hidden">
              <PreviewPanel />
            </div>
          </div>

          {/* Vertical resize handle */}
          <div
            class={cn(
              "w-1 bg-dark-700 cursor-col-resize transition-colors flex-shrink-0 flex items-center justify-center group hover:bg-accent-primary/50",
              dragDirection() === 'vertical' && "bg-accent-primary"
            )}
            onMouseDown={startVerticalDrag}
          >
            <div class={cn(
              "h-8 w-0.5 bg-dark-500 rounded-full group-hover:bg-white/50",
              dragDirection() === 'vertical' && "bg-white"
            )} />
          </div>

          {/* Right column: Chat */}
          <div class="flex-1 overflow-hidden">
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
