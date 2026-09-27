
import { IconDotsVertical, IconInfoCircle, IconPhone, IconSearch } from "@tabler/icons-react";
import { useState } from "react";

interface ChatHeaderActionsProps {
  onSearch?: () => void;
  onCall?: () => void;
  onInfo?: () => void;
}

export function ChatHeaderActions({ onSearch, onCall, onInfo }: ChatHeaderActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const iconBtn = "p-1.5 rounded-md text-primary-button hover:bg-primary-button hover:text-white transition-colors";

  return (
    <div className="ml-auto relative flex items-center gap-1">
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-1">
        <button type="button" onClick={onSearch} className={iconBtn} title="IconSearch">
          <IconSearch className="w-4 h-4" />
        </button>
        <button type="button" onClick={onCall} className={iconBtn} title="Start call">
          <IconPhone className="w-4 h-4" />
        </button>
        <button type="button" onClick={onInfo} className={iconBtn} title="Details">
          <IconInfoCircle className="w-4 h-4" />
        </button>
        <button type="button" onClick={onInfo} className={iconBtn} title="More">
          <IconDotsVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile */}
      <div className="md:hidden relative">
        <button
          type="button"
          onClick={() => setShowDropdown(v => !v)}
          className={iconBtn}
          title="More options"
        >
          <IconDotsVertical className="w-4 h-4" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden">
            {[
              { label: "IconSearch", fn: onSearch, Icon: IconSearch },
              { label: "Start a call", fn: onCall, Icon: IconPhone },
              { label: "Details", fn: onInfo, Icon: IconInfoCircle },
            ].map(({ label, fn, Icon }) => (
              <button
                key={label}
                className="w-full flex items-center gap-2.5 text-left px-3 py-2 hover:bg-muted text-sm text-foreground/80"
                onClick={() => { fn?.(); setShowDropdown(false); }}
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
