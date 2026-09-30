import { useState } from "react";

export function useChatSelection(onBulkDelete?: (messageIds: string[]) => void) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const enterSelectionMode = (id: string) => {
    setIsSelectionMode(true);
    setSelectedIds([id]);
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleBulkDeleteMsg = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} messages?`)) {
      onBulkDelete?.(selectedIds);
      exitSelectionMode();
    }
  };

  return {
    isSelectionMode,
    selectedIds,
    toggleSelection,
    enterSelectionMode,
    exitSelectionMode,
    handleBulkDeleteMsg,
  };
}
