"use client"

import {
  Group,
  Panel,
  Separator,
  useGroupRef,
  usePanelRef,
  useDefaultLayout,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
  type GroupImperativeHandle,
  type PanelImperativeHandle,
  type Layout,
  type LayoutStorage,
  type PanelSize,
  type Orientation,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

interface ResizablePanelGroupProps extends Omit<GroupProps, "orientation"> {
  direction?: Orientation
}

interface ResizablePanelProps extends PanelProps {}

interface ResizableHandleProps extends SeparatorProps {
  withHandle?: boolean
}

function ResizablePanelGroup({
  className,
  direction = "horizontal",
  ...props
}: ResizablePanelGroupProps) {
  return (
    <Group
      orientation={direction}
      data-slot="resizable-panel-group"
      data-orientation={direction}
      className={cn(
        "flex h-full w-full",
        direction === "vertical" && "flex-col",
        className
      )}
      {...props}
    />
  )
}
ResizablePanelGroup.displayName = "ResizablePanelGroup"

function ResizablePanel({ className, ...props }: ResizablePanelProps) {
  return (
    <Panel
      data-slot="resizable-panel"
      className={className}
      {...props}
    />
  )
}
ResizablePanel.displayName = "ResizablePanel"

function ResizableHandle({
  withHandle,
  className,
  children,
  ...props
}: ResizableHandleProps) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "bg-border relative flex items-center justify-center",
        "focus-visible:ring-ring focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden",
        "data-[orientation=horizontal]:w-px data-[orientation=horizontal]:cursor-col-resize",
        "data-[orientation=vertical]:h-px data-[orientation=vertical]:cursor-row-resize",
        "after:absolute",
        "data-[orientation=horizontal]:after:inset-y-0 data-[orientation=horizontal]:after:left-1/2 data-[orientation=horizontal]:after:w-2 data-[orientation=horizontal]:after:-translate-x-1/2",
        "data-[orientation=vertical]:after:inset-x-0 data-[orientation=vertical]:after:top-1/2 data-[orientation=vertical]:after:h-2 data-[orientation=vertical]:after:-translate-y-1/2",
        "[&[data-orientation=vertical]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-sm border">
          <svg
            className="h-2.5 w-2.5 text-muted-foreground"
            viewBox="0 0 6 10"
            fill="currentColor"
          >
            <circle cx="1" cy="1" r="1" />
            <circle cx="1" cy="5" r="1" />
            <circle cx="1" cy="9" r="1" />
            <circle cx="5" cy="1" r="1" />
            <circle cx="5" cy="5" r="1" />
            <circle cx="5" cy="9" r="1" />
          </svg>
        </div>
      )}
      {children}
    </Separator>
  )
}
ResizableHandle.displayName = "ResizableHandle"

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  useGroupRef,
  usePanelRef,
  useDefaultLayout,
  type GroupImperativeHandle,
  type PanelImperativeHandle,
  type ResizablePanelGroupProps,
  type ResizablePanelProps,
  type ResizableHandleProps,
  type Layout,
  type LayoutStorage,
  type PanelSize,
  type Orientation,
}