import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Player } from "../types/fpl";

interface CaptainDialogProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onMakeCaptain: () => void;
  onMakeViceCaptain: () => void;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export function CaptainDialog({
  player,
  isOpen,
  onClose,
  onMakeCaptain,
  onMakeViceCaptain,
  isCaptain,
  isViceCaptain,
}: CaptainDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Captain Selection</DialogTitle>
          <DialogDescription>
            Choose captain status for {player.web_name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            onClick={onMakeCaptain}
            disabled={isCaptain}
            variant={isCaptain ? "outline" : "default"}
          >
            {isCaptain ? "Current Captain" : "Make Captain"}
          </Button>
          <Button
            onClick={onMakeViceCaptain}
            disabled={isViceCaptain}
            variant={isViceCaptain ? "outline" : "default"}
          >
            {isViceCaptain ? "Current Vice Captain" : "Make Vice Captain"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
