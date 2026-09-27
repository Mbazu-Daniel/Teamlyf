"use client"
import Picker, { EmojiClickData } from "emoji-picker-react";
import { IconMoodSmile } from "@tabler/icons-react";

interface EmojiPickerProps {
    onAddEmoji: (emoji: string) => void;
    open: boolean;
    handleEmoji: () => void;
}

export function ThreadEmojiPicker({ onAddEmoji, open, handleEmoji }: EmojiPickerProps) {

    const addEmoji = (emoji: string) => {
        onAddEmoji(emoji);
        handleEmoji();
    };

    return (
        <div className="relative">
            <button
            type="button"
            onClick={handleEmoji}
            className="hover:text-primary-button transition-colors p-1 sm:p-2 hover:bg-sidebar-accent rounded sm:rounded-md"
            title="Add emoji"
            >
            <IconMoodSmile className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {open && (
            <div className="absolute bottom-12 -left-10 z-50 shadow-lg border rounded-lg">
                <Picker
                    onEmojiClick={( emojiData: EmojiClickData) => {
                        addEmoji(emojiData.emoji);
                    }}
                />
            </div>
            )}
        </div>
    )
}