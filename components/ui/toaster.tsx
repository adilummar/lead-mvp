"use client";

import { useToast } from "@/components/providers/toast-context";
import type { ToastVariant } from "@/components/providers/toast-context";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: any; iconColor: string }> = {
  success: {
    bg: "bg-green-50 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    icon: CheckCircle2,
    iconColor: "text-green-600",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    icon: AlertCircle,
    iconColor: "text-red-600",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: Info,
    iconColor: "text-blue-600",
  },
  warning: {
    bg: "bg-orange-50 dark:bg-orange-900/30",
    border: "border-orange-200 dark:border-orange-800",
    icon: AlertTriangle,
    iconColor: "text-orange-600",
  },
};

function ToastItem({ id, message, variant }: { id: string; message: string; variant: ToastVariant }) {
  const { removeToast } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => removeToast(id), 200);
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 ease-out ${style.bg} ${style.border} ${
        visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
      }`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${style.iconColor}`} />
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 min-w-0">{message}</p>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem id={t.id} message={t.message} variant={t.variant} />
        </div>
      ))}
    </div>
  );
}
