import { IconAt, IconDotsVertical, IconMicrophone, IconPaperclip } from "@tabler/icons-react";
import { EmojiPicker } from "../emoji-picker-modal";
import { MentionsDropdown } from "./mentions-dropdown";
import { TenantMember } from "@/features/chat/types/tenant-members/types";
import type { ComponentType, RefObject } from "react";

type EmojiPickerComponentProps = {
  onAddEmoji: (emoji: string) => void;
  open: boolean;
  handleEmoji: () => void;
};

type ComposerToolbarProps = {
  value: string;
  type?: "channel" | "direct";
  isRecording: boolean;
  isUploading: boolean;
  hasAttachments: boolean;
  showEmojiPicker: boolean;
  showMentions: boolean;
  showMoreMenu: boolean;
  filteredMembers: TenantMember[];
  mentionsRef: RefObject<HTMLDivElement | null>;
  moreMenuRef: RefObject<HTMLDivElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onMic: () => void;
  onAddEmoji: (emoji: string) => void;
  onToggleEmoji: () => void;
  onToggleMention: () => void;
  onAddMention: (memberId: string, firstName: string, lastName: string) => void;
  onAttachment: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMore: () => void;
  onClearFormatting: () => void;
  onCloseMore: () => void;
  onSend: () => void;
  EmojiPickerComponent?: ComponentType<EmojiPickerComponentProps>;
  sendButtonTitle?: string;
};

export function ComposerToolbar({
  value,
  type,
  isRecording,
  isUploading,
  hasAttachments,
  showEmojiPicker,
  showMentions,
  showMoreMenu,
  filteredMembers,
  mentionsRef,
  moreMenuRef,
  fileInputRef,
  onMic,
  onAddEmoji,
  onToggleEmoji,
  onToggleMention,
  onAddMention,
  onAttachment,
  onFileSelect,
  onToggleMore,
  onClearFormatting,
  onCloseMore,
  onSend,
  EmojiPickerComponent = EmojiPicker,
  sendButtonTitle = "Send message",
}: ComposerToolbarProps) {
  const moreOptions = [
    { label: "Poll", action: () => {} },
    { label: "Schedule message", action: () => {} },
    { label: "Clear formatting", action: onClearFormatting },
  ];

  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <div className="flex items-center gap-0.5 text-muted-foreground">
        <button
          type="button"
          onClick={onMic}
          title={isRecording ? "Stop recording" : "Voice message"}
          className={`p-1.5 rounded-md transition-colors hover:bg-primary-button/10 hover:text-primary-button
            ${isRecording ? "text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600" : ""}`}
        >
          <IconMicrophone className="h-4 w-4" />
        </button>

        <EmojiPickerComponent
          onAddEmoji={onAddEmoji}
          open={showEmojiPicker}
          handleEmoji={onToggleEmoji}
        />

        {type !== "direct" && (
          <div className="relative" ref={mentionsRef}>
            <button
              type="button"
              onClick={onToggleMention}
              title="Mention someone"
              className={`p-1.5 rounded-md transition-colors hover:bg-primary-button/10 hover:text-primary-button ${showMentions ? "bg-primary-button/10 text-primary-button" : ""}`}
            >
              <IconAt className="h-4 w-4" />
            </button>

            {showMentions && <MentionsDropdown members={filteredMembers} onSelect={onAddMention} />}
          </div>
        )}

        <button
          type="button"
          onClick={onAttachment}
          title="Attach file"
          className="p-1.5 rounded-md transition-colors hover:bg-primary-button/10 hover:text-primary-button"
        >
          <IconPaperclip className="h-4 w-4" />
        </button>

        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={onToggleMore}
            title="More options"
            className={`p-1.5 rounded-md transition-colors hover:bg-primary-button/10 hover:text-primary-button ${showMoreMenu ? "bg-primary-button/10 text-primary-button" : ""}`}
          >
            <IconDotsVertical className="h-4 w-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-popover border border-border rounded-md shadow-md p-1 w-48 z-50">
              {moreOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    option.action();
                    onCloseMore();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-muted rounded-md text-sm transition-colors cursor-pointer"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelect} multiple />
      </div>

      <div className="flex items-center gap-2">
        {value.trim() && (
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/50 select-none">
            <kbd className="font-mono border border-border/60 rounded px-1 py-0.5 text-[9px]">
              Enter
            </kbd>
            to send
          </span>
        )}

        <button
          disabled={(!value.trim() && !hasAttachments) || isUploading}
          onClick={onSend}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-button text-white hover:bg-primary-button/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          title={sendButtonTitle}
          aria-label={sendButtonTitle}
        >
          {isUploading ? (
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className="h-3.5 w-3.5 translate-x-px"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
