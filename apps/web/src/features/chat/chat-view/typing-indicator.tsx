import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { TypingDots } from "./icons";

interface TypingIndicatorProps {
  typingUsers: string[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  return (
    <div className="px-4 py-1 flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {typingUsers.slice(0, 3).map((name, i) => (
          <Avatar key={i} border="background" ring="hairline" className="h-4 w-4">
            <AvatarFallback bg="primary-5" size="7px" weight="bold" tone="primary">
              {name[0]}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <p className="text-[10px] font-medium text-muted-foreground/80 lowercase">
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing`
            : typingUsers.length === 2
              ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
              : `${typingUsers.length} people are typing`
          }
        </p>
        <TypingDots />
      </div>
    </div>
  );
}
