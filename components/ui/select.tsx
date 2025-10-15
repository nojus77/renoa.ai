


import * as React from "react"
import * as RadixSelect from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = RadixSelect.Root
const SelectGroup = RadixSelect.Group
const SelectValue = RadixSelect.Value

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  RadixSelect.SelectTriggerProps & { className?: string }
>(
  ({ className, ...props }, ref) => (
    <RadixSelect.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SelectValue className="text-muted-foreground" />
      <RadixSelect.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  )
)
SelectTrigger.displayName = RadixSelect.Trigger.displayName

const SelectContent = React.forwardRef<
  HTMLDivElement,
  RadixSelect.SelectContentProps & { className?: string }
>(
    ({ className, children, position = "popper", ...props }, ref) => (
      <RadixSelect.Portal container={typeof window !== "undefined" ? (document.getElementById('portal-root') || document.body) : undefined}>
        <RadixSelect.Content
          ref={ref}
          className={cn(
            "relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-card shadow-md animate-in fade-in-0 slide-in-from-top-1",
            className
          )}
          position={position}
          sideOffset={5}
          {...props}
        >
          {children}
          <RadixSelect.ScrollUpButton className="flex items-center justify-center h-8 bg-muted">
            <ChevronUp className="h-4 w-4" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="p-1" />
          <RadixSelect.ScrollDownButton className="flex items-center justify-center h-8 bg-muted">
            <ChevronDown className="h-4 w-4" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    )
)
SelectContent.displayName = RadixSelect.Content.displayName

const SelectLabel = RadixSelect.Label

const SelectItem = React.forwardRef<
  HTMLDivElement,
  RadixSelect.SelectItemProps & { className?: string }
>(
  ({ className, children, ...props }, ref) => (
    <RadixSelect.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-2 pr-8 text-sm outline-none focus:bg-muted/50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <RadixSelect.ItemIndicator>
          <Check className="h-4 w-4" />
        </RadixSelect.ItemIndicator>
      </span>
    </RadixSelect.Item>
  )
)
SelectItem.displayName = RadixSelect.Item.displayName

const SelectSeparator = RadixSelect.Separator
const SelectScrollUpButton = RadixSelect.ScrollUpButton
const SelectScrollDownButton = RadixSelect.ScrollDownButton

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
