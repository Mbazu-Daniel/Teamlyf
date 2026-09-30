import { useEffect, useRef } from "react";
import Picker, { EmojiClickData } from "emoji-picker-react";
import { IconMoodSmile } from "@tabler/icons-react";

interface EmojiPickerProps {
  onAddEmoji: (emoji: string) => void;
  open: boolean;
  handleEmoji: () => void;
}

export function EmojiPicker({ onAddEmoji, open, handleEmoji }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleEmoji();
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open, handleEmoji]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleEmoji}
        className={`p-1.5 rounded-md transition-colors hover:bg-primary-button/10 hover:text-primary-button ${open ? "bg-primary-button/10 text-primary-button" : ""}`}
        title="Add emoji"
      >
        <IconMoodSmile className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="
            absolute z-50 bottom-full mb-2
            left-0 sm:left-auto sm:right-auto
            w-[min(340px,calc(100vw-24px))]
            shadow-xl rounded-xl border border-border overflow-hidden
          "
        >
          <Picker
            onEmojiClick={(emojiData: EmojiClickData) => {
              onAddEmoji(emojiData.emoji);
              handleEmoji();
            }}
            searchPlaceholder="Search emoji…"
            skinTonesDisabled
            width="100%"
            height={360}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
}
