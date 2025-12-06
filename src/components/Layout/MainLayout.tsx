// ============================================================================
// MainLayout Component - Two-column responsive layout with resizable panels
// ============================================================================

import { Component, createSignal, Show, createEffect, onCleanup } from 'solid-js';
import { Header } from './Header';
import { FileTree } from '../FileTree';
import { PreviewPanel } from '../Preview';
import { ChatPanel } from '../Chat';
import { FolderIcon, LayoutIcon, MessageCircleIcon } from '../Common/Icons';
import { cn } from '../../utils/helpers';

type MobileTab = 'files' | 'preview' | 'chat';
type DragType = 'none' | 'vertical' | 'horizontal';

export const MainLayout: Component = () => {
  const [mobileTab, setMobileTab] = createSignal<MobileTab>('files');

  // Panel sizes (percentages for flexibility)
  const [leftColumnWidth, setLeftColumnWidth] = createSignal(50);
  const [filesHeight, setFilesHeight] = createSignal(60);

  // Drag state
  const [dragType, setDragType] = createSignal<DragType>('none');

  // Refs
  let desktopContainerRef: HTMLDivElement | undefined;
  let leftColumnRef: HTMLDivElement | undefined;

  // Mouse move handler
  const onMouseMove = (e: MouseEvent) => {
    const currentDrag = dragType();

    if (currentDrag === 'vertical' && desktopContainerRef) {
      const rect = desktopContainerRef.getBoundingClientRect();
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftColumnWidth(Math.max(25, Math.min(75, percentage)));
    }

    if (currentDrag === 'horizontal' && leftColumnRef) {
      const rect = leftColumnRef.getBoundingClientRect();
      const percentage = ((e.clientY - rect.top) / rect.height) * 100;
      setFilesHeight(Math.max(20, Math.min(80, percentage)));
    }
  };

  // Mouse up handler
  const onMouseUp = () => {
    setDragType('none');
  };

  // Set up global event listeners when dragging starts
  createEffect(() => {
    const currentDrag = dragType();

    if (currentDrag !== 'none') {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      onCleanup(() => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      });
    }
  });

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

  const isDragging = () => dragType() !== 'none';

  return (
    <div class="h-screen flex flex-col bg-dark-950 overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <div class="flex-1 flex overflow-hidden">
        {/* Desktop: Two-column layout */}
        <div
          ref={desktopContainerRef}
          class={cn(
            "hidden md:flex flex-1",
            isDragging() && "select-none"
          )}
          style={{ cursor: dragType() === 'vertical' ? 'col-resize' : dragType() === 'horizontal' ? 'row-resize' : 'auto' }}
        >
          {/* Left column: Files + Preview (stacked) */}
          <div
            ref={leftColumnRef}
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
                "h-1 bg-dark-700 cursor-row-resize transition-colors flex-shrink-0 hover:bg-accent-primary",
                dragType() === 'horizontal' && "bg-accent-primary"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                setDragType('horizontal');
              }}
            />

            {/* Preview panel (bottom) */}
            <div class="flex-1 overflow-hidden">
              <PreviewPanel />
            </div>
          </div>

          {/* Vertical resize handle */}
          <div
            class={cn(
              "w-1 bg-dark-700 cursor-col-resize transition-colors flex-shrink-0 hover:bg-accent-primary",
              dragType() === 'vertical' && "bg-accent-primary"
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              setDragType('vertical');
            }}
          />

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
