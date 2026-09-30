import {
  IconArrowForwardUp,
  IconBookmark,
  IconCheckbox,
  IconDots,
  IconMessageCircle,
  IconMoodPlus,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import EmojiPicker, { Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";

interface MessageHoverActionsProps {
  onReply: () => void;
  onReact: (emoji: string) => void;
  onSave: () => void;
  onForward: () => void;
  onMore: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
  isVisible?: boolean;
}

export function MessageHoverActions({
  onReply,
  onReact,
  onSave,
  onForward,
  onMore,
  onDelete,
  onSelect,
  isVisible,
}: MessageHoverActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        "absolute right-2 -top-4 z-10 items-center justify-center gap-1 rounded-md border bg-background shadow-sm p-1",
        isVisible || isOpen ? "flex" : "hidden sm:group-hover:flex",
      )}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => e.stopPropagation()}
          >
            <IconMoodPlus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent variant="flush" className="w-auto z-[200]" align="start" side="top">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              onReact(emojiData.emoji);
              setIsOpen(false);
            }}
            theme={Theme.LIGHT}
            lazyLoadEmojis={true}
            searchDisabled={true}
            skinTonesDisabled={true}
            previewConfig={{ showPreview: false }}
          />
        </PopoverContent>
      </Popover>
      <ActionButton
        onClick={(e) => {
          e.stopPropagation();
          onReply();
        }}
        icon={<IconMessageCircle className="h-4 w-4" />}
      />
      <ActionButton
        onClick={(e) => {
          e.stopPropagation();
          onForward();
        }}
        icon={<IconArrowForwardUp className="h-4 w-4" />}
      />
      <ActionButton
        onClick={(e) => {
          e.stopPropagation();
          onSave();
        }}
        icon={<IconBookmark className="h-4 w-4" />}
      />
      <ActionButton
        onClick={(e) => {
          e.stopPropagation();
          onMore();
        }}
        icon={<IconDots className="h-4 w-4" />}
      />
      {onDelete && (
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          icon={<IconTrash className="h-4 w-4 text-red-500" />}
          variant="danger-ghost"
        />
      )}
      {onSelect && (
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          icon={<IconCheckbox className="h-4 w-4" />}
        />
      )}
    </div>
  );
}

function ActionButton({
  icon,
  onClick,
  className,
  variant = "ghost",
}: {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  return (
    <Button variant={variant} size="icon" onClick={onClick} className={cn("h-7 w-7", className)}>
      {icon}
    </Button>
  );
}
