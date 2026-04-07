"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/providers/toast-context";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { FileText, CheckCircle2, Plus, Clock, Trash2, Calendar } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Group updates by date
function groupByDate(updates: any[]) {
  const groups: Record<string, any[]> = {};
  for (const u of updates) {
    const key = formatDate(u.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(u);
  }
  return Object.entries(groups);
}

export default function ProjectReport({ project }: { project: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: updates, isLoading } = useQuery({
    queryKey: ["project-updates", project._id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${project._id}/updates`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${project._id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, type: "Manual", date }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-updates", project._id] });
      toast.success("Entry added to report");
      setMessage("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (updateId: string) => {
      const res = await fetch(`/api/projects/${project._id}/updates?updateId=${updateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-updates", project._id] });
      toast.success("Entry removed");
    },
  });

  const grouped = groupByDate(updates || []);
  const totalUpdates = (updates || []).length;
  const tasksDone = (updates || []).filter((u: any) => u.type === "TaskDone").length;

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl font-bold">📊 Report — {project.title}</DialogTitle>
      </DialogHeader>

      {/* Summary stats */}
      <div className="flex gap-3">
        <div className="flex-1 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
          <p className="text-lg font-extrabold text-green-700">{totalUpdates}</p>
          <p className="text-[10px] font-semibold text-green-600 uppercase">Total Entries</p>
        </div>
        <div className="flex-1 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-center">
          <p className="text-lg font-extrabold text-emerald-700">{tasksDone}</p>
          <p className="text-[10px] font-semibold text-emerald-600 uppercase">Tasks Done</p>
        </div>
        <div className="flex-1 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
          <p className="text-lg font-extrabold text-blue-700">{totalUpdates - tasksDone}</p>
          <p className="text-[10px] font-semibold text-blue-600 uppercase">Manual Notes</p>
        </div>
      </div>

      {/* Add entry form */}
      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 space-y-2">
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[140px] rounded-xl h-10 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder="What happened on this date..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 rounded-xl min-h-[60px] resize-none text-sm"
          />
          <Button
            onClick={() => message.trim() && addMutation.mutate()}
            disabled={addMutation.isPending || !message.trim()}
            className="rounded-xl px-4 bg-green-600 hover:bg-green-700 text-white shrink-0 self-end"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-h-[45vh] overflow-y-auto pr-1 space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading report...</div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No entries yet. Add your first report entry above.</p>
          </div>
        ) : (
          grouped.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{dateLabel}</p>
                <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
              </div>
              <div className="space-y-1.5 ml-4 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
                {items.map((update: any) => {
                  const isTask = update.type === "TaskDone";
                  return (
                    <div key={update._id} className="flex items-start gap-3 py-2 group/item">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isTask ? "bg-emerald-100" : "bg-blue-100"}`}>
                        {isTask ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200">{update.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {isTask ? "✅ Auto-logged" : "📝 Manual entry"}
                          {" · "}
                          {new Date(update.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </p>
                      </div>
                      {!isTask && (
                        <button
                          onClick={() => setConfirmDelete(update._id)}
                          className="shrink-0 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover/item:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete); setConfirmDelete(null); }}
        title="Delete this entry?"
        description="This entry will be permanently removed from the report."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
