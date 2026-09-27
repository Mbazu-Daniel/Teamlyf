import { IconX, IconTrash } from "@tabler/icons-react";

interface ChatSelectionBarProps {
  selectedCount: number;
  onExit: () => void;
  onBulkDelete: () => void;
  isBulkDeleting?: boolean;
}

export function ChatSelectionBar({
  selectedCount,
  onExit,
  onBulkDelete,
  isBulkDeleting,
}: ChatSelectionBarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-[100] h-14 bg-primary-button text-white flex items-center justify-between px-4 animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-4">
        <button onClick={onExit} className="p-1 hover:bg-white/20 rounded-full cursor-pointer">
          <IconX size={20} />
        </button>
        <span className="font-bold">{selectedCount} Selected</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onBulkDelete}
          disabled={selectedCount === 0 || isBulkDeleting}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-md font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] justify-center cursor-pointer"
        >
          {isBulkDeleting ? (
            <>
              <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <IconTrash size={16} />
              Delete
            </>
          )}
        </button>
      </div>
    </div>
  );
}
