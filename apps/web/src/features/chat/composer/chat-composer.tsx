import { useCallback, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { structureMentionContent } from "./composer-utils";
import { useComposerAttachments } from "./hooks/use-composer-attachments";
import { useComposerMembers } from "./hooks/use-composer-members";
import { useComposerRecording } from "./hooks/use-composer-recording";
import { useOutsideClickClose } from "./hooks/use-outside-click-close";
import { AttachmentPreviews } from "./attachment-previews";
import { ComposerToolbar } from "./composer-toolbar";
import { RecordingIndicator } from "./recording-indicator";
import type { ChatComposerProps } from "./types";

export function ChatComposer({
  value,
  onChange,
  onSend,
  onTyping,
  tenantId,
  channelId,
  conversationId,
  type,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionSearch, setMentionSearch] = useState("");

  const {
    attachments,
    setAttachments,
    isUploading,
    setIsUploading,
    handleFileSelect,
    handlePaste,
    removeAttachment,
    uploadFiles,
    retryUpload,
    clearAttachments,
  } = useComposerAttachments({ tenantId, channelId, conversationId });

  const { membersToUse, filteredMembers } = useComposerMembers(
    tenantId,
    channelId,
    type,
    mentionSearch
  );

  const { isRecording, recordingTime, handleMic } =
    useComposerRecording(setAttachments);

  useOutsideClickClose(
    showMentions,
    mentionsRef,
    setShowMentions,
    showMoreMenu,
    moreMenuRef,
    setShowMoreMenu
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      onChange(val);
      onTyping();

      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = val.slice(0, cursorPosition);
      const words = textBeforeCursor.split(/\s+/);
      const currentWord = words[words.length - 1];

      if (type !== "direct" && currentWord.startsWith("@")) {
        setShowMentions(true);
        setMentionSearch(currentWord.slice(1).toLowerCase());
        setShowEmojiPicker(false);
        setShowMoreMenu(false);
      } else {
        setShowMentions(false);
      }

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    },
    [onChange, onTyping, type]
  );

  const addEmoji = (emoji: string) => {
    onChange(value + emoji);
  };

  const handleMention = () => {
    if (type === "direct") return;
    setShowMentions(!showMentions);
    setShowMoreMenu(false);
    setShowEmojiPicker(false);
    if (!showMentions) {
      setMentionSearch("");
    }
  };

  const addMention = (
    memberId: string,
    firstName: string,
    lastName: string
  ) => {
    const fullName = `${firstName} ${lastName}`.trim();
    const words = value.split(/\s+/);
    const lastWord = words[words.length - 1];
    const mentionText = `@${fullName} `;

    let newValue = value;
    if (lastWord.startsWith("@")) {
      const lastAtPos = value.lastIndexOf("@");
      newValue = value.slice(0, lastAtPos) + mentionText;
    } else {
      newValue = value + (value.endsWith(" ") ? "" : " ") + mentionText;
    }

    onChange(newValue);
    setMentionedUserIds((prev) => Array.from(new Set([...prev, memberId])));
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleSend = async (overrideAttachmentIds?: string[]) => {
    let attachmentIds = overrideAttachmentIds;
    try {
      if (!attachmentIds && attachments.length > 0) {
        setIsUploading(true);
        attachmentIds = await uploadFiles();
      }

      const failedAttachments = attachments.filter(
        (att) => att.status === "failed"
      );
      if (failedAttachments.length > 0) {
        throw new Error(
          "Please retry or remove failed attachments before sending"
        );
      }

      const finalContent = structureMentionContent(
        value,
        mentionedUserIds,
        membersToUse
      );

      await onSend(attachmentIds, mentionedUserIds, finalContent);

      clearAttachments();
      setMentionedUserIds([]);
      onChange("");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to send message");
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const runSend = async () => {
    try {
      await handleSend();
    } catch {
      /* error handled by handleSend toast */
    }
  };

  return (
    <div className="px-3 py-2.5 shrink-0">
      <div
        className={`
        flex flex-col rounded-md border bg-background
        transition-all duration-150
        focus-within:ring-2 focus-within:ring-primary-button/30 focus-within:border-primary-button/50
      `}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder="Message…"
          rows={1}
          appearance="composer"
          className="flex-1 resize-none overflow-y-auto max-h-36 min-h-[40px]"
          onKeyDown={async (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              await runSend();
            }
          }}
        />

        {isRecording && <RecordingIndicator recordingTime={recordingTime} />}

        <AttachmentPreviews
          attachments={attachments}
          onRemove={removeAttachment}
          onRetry={retryUpload}
        />

        <div className="mx-3 border-t border-border/50" />

        <ComposerToolbar
          value={value}
          type={type}
          isRecording={isRecording}
          isUploading={isUploading}
          hasAttachments={attachments.length > 0}
          showEmojiPicker={showEmojiPicker}
          showMentions={showMentions}
          showMoreMenu={showMoreMenu}
          filteredMembers={filteredMembers}
          mentionsRef={mentionsRef}
          moreMenuRef={moreMenuRef}
          fileInputRef={fileInputRef}
          onMic={handleMic}
          onAddEmoji={addEmoji}
          onToggleEmoji={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowMentions(false);
          }}
          onToggleMention={handleMention}
          onAddMention={addMention}
          onAttachment={() => fileInputRef.current?.click()}
          onFileSelect={handleFileSelect}
          onToggleMore={() => {
            setShowMoreMenu(!showMoreMenu);
            setShowMentions(false);
            setShowEmojiPicker(false);
          }}
          onClearFormatting={() => onChange("")}
          onCloseMore={() => setShowMoreMenu(false)}
          onSend={runSend}
        />
      </div>
    </div>
  );
}
