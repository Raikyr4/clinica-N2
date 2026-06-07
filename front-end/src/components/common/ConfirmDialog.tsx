import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  /** If true, shows a textarea for user input */
  withInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  onConfirm: (inputValue?: string) => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  withInput = false,
  inputLabel,
  inputPlaceholder,
  onConfirm,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");

  const handleConfirm = () => {
    onConfirm(withInput ? inputValue : undefined);
    setInputValue("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setInputValue("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {withInput && (
          <div className="space-y-2 py-2">
            {inputLabel && <Label className="text-sm">{inputLabel}</Label>}
            <Textarea
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
