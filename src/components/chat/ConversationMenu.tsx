import {
  MoreVertical,
  Archive,
  Star,
  Bell,
  BellOff,
  Trash,
  Ban,
  ArchiveRestore,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConversation } from "@/hooks/useConversation";
import type { Conversation } from "@/types/user";
import { useTheme } from "@/context/ThemeContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ConversationMenuProps {
  conversation: Conversation;
  onStateChange: (updates: Partial<Conversation>) => void;
}

export const ConversationMenu = ({
  conversation,
  onStateChange,
}: ConversationMenuProps) => {
  const { theme } = useTheme();
  const {
    toggleStar,
    toggleMute,
    toggleBlock,
    archive,
    unarchive,

    deleteConversation,
  } = useConversation(conversation.id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleAction = async (
    e: React.MouseEvent,
    action: () => Promise<unknown>,
    updates: Partial<Conversation>
  ) => {
    e.stopPropagation();
    await action();
    onStateChange(updates);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <div
            className={
              theme === "dark"
                ? "cursor-pointer p-1 hover:bg-gray-700 rounded-full"
                : "cursor-pointer p-1 hover:bg-white rounded-full"
            }
          >
            <MoreVertical className="h-4 w-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) =>
              handleAction(e, toggleStar, {
                is_starred: !conversation.is_starred,
              })
            }
          >
            <Star
              className={`mr-2 h-4 w-4 ${
                conversation.is_starred ? "text-yellow-500" : ""
              }`}
            />
            {conversation.is_starred ? "Unstar" : "Star"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) =>
              handleAction(e, toggleMute, { is_muted: !conversation.is_muted })
            }
          >
            {conversation.is_muted ? (
              <Bell className="mr-2 h-4 w-4" />
            ) : (
              <BellOff className="mr-2 h-4 w-4" />
            )}
            {conversation.is_muted ? "Unmute" : "Mute"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) =>
              handleAction(e, toggleBlock, {
                is_blocked: !conversation.is_blocked,
              })
            }
          >
            <Ban
              className={`mr-2 h-4 w-4 ${
                conversation.is_blocked ? "text-red-500" : ""
              }`}
            />
            {conversation.is_blocked ? "Unblock" : "Block"}
          </DropdownMenuItem>
          {conversation.is_archived ? (
            <DropdownMenuItem
              onClick={(e) =>
                handleAction(e, unarchive, { is_archived: false })
              }
            >
              <ArchiveRestore className="mr-2 h-4 w-4" />
              Unarchive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={(e) => handleAction(e, archive, { is_archived: true })}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteDialogOpen(true);
            }}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteConversation();
                setIsDeleteDialogOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
