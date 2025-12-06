// ============================================================================
// MainLayout Component - Two-column responsive layout with resizable panels
// ============================================================================

import { Component, createSignal, Show, onMount, onCleanup } from 'solid-js';
import { Header } from './Header';
import { FileTree } from '../FileTree';
import { PreviewPanel } from '../Preview';
import { ChatPanel } from '../Chat';
import { FolderIcon, LayoutIcon, MessageCircleIcon } from '../Common/Icons';
import { cn } from '../../utils/helpers';

type MobileTab = 'files' | 'preview' | 'chat';

export const MainLayout: Component = () => {
  const [mobileTab, setMobileTab] = createSignal<MobileTab>('files');

  // Panel sizes (percentages for flexibility)
  const [leftColumnWidth, setLeftColumnWidth] = createSignal(50); // % of total width
  const [filesHeight, setFilesHeight] = createSignal(60); // % of left column height

  // Drag state
  const [isDraggingVertical, setIsDraggingVertical] = createSignal(false);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = createSignal(false);

  let containerRef: HTMLDivElement | undefined;
  let leftColumnRef: HTMLDivElement | undefined;

  // Handle vertical divider drag (between left and right columns)
  const handleVerticalDragStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVertical(true);
  };

  // Handle horizontal divider drag (between files and preview)
  const handleHorizontalDragStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingHorizontal(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const container = containerRef;
    const leftColumn = leftColumnRef;

    if (isDraggingVertical() && container) {
      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      // Clamp between 25% and 75%
      setLeftColumnWidth(Math.max(25, Math.min(75, newWidth)));
    }

    if (isDraggingHorizontal() && leftColumn) {
      const leftRect = leftColumn.getBoundingClientRect();
      const newHeight = ((e.clientY - leftRect.top) / leftRect.height) * 100;
      // Clamp between 20% and 80%
      setFilesHeight(Math.max(20, Math.min(80, newHeight)));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingVertical(false);
    setIsDraggingHorizontal(false);
  };

  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  });

  onCleanup(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
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

  return (
    <div class="h-screen flex flex-col bg-dark-950 overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <div
        ref={(el) => (containerRef = el)}
        class={cn(
          "flex-1 flex overflow-hidden",
          (isDraggingVertical() || isDraggingHorizontal()) && "select-none cursor-grabbing"
        )}
      >
        {/* Desktop: Two-column layout */}
        <div class="hidden md:flex flex-1">
          {/* Left column: Files + Preview (stacked) */}
          <div
            ref={(el) => (leftColumnRef = el)}
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
                "h-2 bg-dark-800 hover:bg-accent-primary/50 cursor-row-resize transition-colors flex-shrink-0 group",
                isDraggingHorizontal() && "bg-accent-primary"
              )}
              onMouseDown={handleHorizontalDragStart}
            >
              <div class="h-full w-full flex items-center justify-center">
                <div class={cn(
                  "w-12 h-1 bg-dark-600 rounded-full transition-colors",
                  "group-hover:bg-accent-primary/70",
                  isDraggingHorizontal() && "bg-accent-primary"
                )} />
              </div>
            </div>

            {/* Preview panel (bottom) */}
            <div
              class="flex-1 overflow-hidden"
              style={{ height: `${100 - filesHeight()}%` }}
            >
              <PreviewPanel />
            </div>
          </div>

          {/* Vertical resize handle */}
          <div
            class={cn(
              "w-2 bg-dark-800 hover:bg-accent-primary/50 cursor-col-resize transition-colors flex-shrink-0 group",
              isDraggingVertical() && "bg-accent-primary"
            )}
            onMouseDown={handleVerticalDragStart}
          >
            <div class="h-full w-full flex items-center justify-center">
              <div class={cn(
                "h-12 w-1 bg-dark-600 rounded-full transition-colors",
                "group-hover:bg-accent-primary/70",
                isDraggingVertical() && "bg-accent-primary"
              )} />
            </div>
          </div>

          {/* Right column: Chat */}
          <div
            class="flex-1 overflow-hidden"
            style={{ width: `${100 - leftColumnWidth()}%` }}
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
