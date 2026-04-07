"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/providers/toast-context";
import { Phone, FileText, CheckCircle2, ArrowRightLeft, Plus, Clock } from "lucide-react";

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  Note: { icon: FileText, color: "text-blue-600", bg: "bg-blue-100", label: "📝 Note" },
  Call: { icon: Phone, color: "text-green-600", bg: "bg-green-100", label: "📞 Call" },
  TaskDone: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100", label: "✅ Task Done" },
  StatusChange: { icon: ArrowRightLeft, color: "text-purple-600", bg: "bg-purple-100", label: "🔄 Status" },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Group activities by date
function groupByDate(activities: any[]) {
  const groups: Record<string, any[]> = {};
  for (const a of activities) {
    const key = formatDate(a.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  return Object.entries(groups);
}

export default function LeadActivity({ lead }: { lead: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [type, setType] = useState("Note");

  const { data: activities, isLoading } = useQuery({
    queryKey: ["lead-activity", lead._id],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${lead._id}/activity`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/leads/${lead._id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, type }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activity", lead._id] });
      toast.success("Entry added to history");
      setMessage("");
    },
  });

  const grouped = groupByDate(activities || []);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl font-bold">📋 History — {lead.name}</DialogTitle>
      </DialogHeader>

      {/* Add entry */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          <Select value={type} onValueChange={(v) => setType(v || "Note")}>
            <SelectTrigger className="w-[120px] rounded-xl h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Note">📝 Note</SelectItem>
              <SelectItem value="Call">📞 Call</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="What happened..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && message.trim() && addMutation.mutate()}
            className="flex-1 rounded-xl h-10"
          />
          <Button
            onClick={() => message.trim() && addMutation.mutate()}
            disabled={addMutation.isPending || !message.trim()}
            className="rounded-xl h-10 px-4 bg-green-600 hover:bg-green-700 text-white shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading history...</div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No history yet. Add your first entry above.</p>
          </div>
        ) : (
          grouped.map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{date}</p>
                <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
              </div>
              <div className="space-y-1.5 ml-4 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
                {items.map((activity: any) => {
                  const config = typeConfig[activity.type] || typeConfig.Note;
                  const Icon = config.icon;
                  return (
                    <div key={activity._id} className="flex items-start gap-3 py-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200">{activity.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(activity.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
