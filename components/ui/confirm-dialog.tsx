"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[400px] rounded-2xl border-none shadow-2xl p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`p-3 rounded-2xl ${variant === "destructive" ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/20"}`}>
            <AlertTriangle className={`w-7 h-7 ${variant === "destructive" ? "text-red-500" : "text-green-600"}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 mt-1.5">{description}</p>
          </div>
          <div className="flex items-center gap-3 w-full pt-2">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-11 rounded-xl text-sm font-semibold"
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 h-11 rounded-xl text-sm font-semibold text-white ${
                variant === "destructive" 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "Please wait..." : confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
