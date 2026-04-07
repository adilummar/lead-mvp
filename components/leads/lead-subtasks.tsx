"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Circle, Plus, Trash2, Calendar } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/providers/toast-context";

function getDayLabel(dueDate?: string | null): string {
  if (!dueDate) return "No date";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(dueDate);
  const due = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (due < today) return "⚠ Overdue";
  if (due.getTime() === today.getTime()) return "Today";
  if (due.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getDayLabelClass(dueDate?: string | null): string {
  if (!dueDate) return "text-gray-400";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(dueDate);
  const due = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (due < today) return "text-red-500 font-semibold";
  if (due.getTime() === today.getTime()) return "text-orange-600 font-semibold";
  return "text-gray-400";
}

export default function LeadSubtasks({ lead }: { lead: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [taskName, setTaskName] = useState("");
  // Store as YYYY-MM-DD string for the date input
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);

  const updateTodos = async (todos: any[]) => {
    const res = await fetch(`/api/leads/${lead._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todos })
    });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const dueDateISO = dueDate ? new Date(dueDate + "T00:00:00").toISOString() : undefined;
      // Compute bucket label for legacy assignedToDay field
      let assignedToDay = "Later";
      if (dueDate) {
        const label = getDayLabel(dueDateISO);
        if (label === "Today") assignedToDay = "Today";
        else if (label === "Tomorrow") assignedToDay = "Tomorrow";
      }
      const newTodo = {
        taskName,
        assignedToDay,
        dueDate: dueDateISO,
        createdDate: new Date().toISOString(),
        isCompleted: false,
        priority: "Medium",
        addedToTodo: false,
      };
      return updateTodos([...(lead.todos || []), newTodo]);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leads"] }); setTaskName(""); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (idx: number) => {
      const updated = lead.todos.filter((_: any, i: number) => i !== idx);
      return updateTodos(updated);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leads"] }); toast.success("Task removed"); }
  });

  const toggleMutation = useMutation({
    mutationFn: async (idx: number) => {
      const task = lead.todos[idx];
      const willComplete = !task.isCompleted;
      const updated = lead.todos.map((t: any, i: number) =>
        i === idx
          ? { ...t, isCompleted: willComplete, completedAt: willComplete ? new Date().toISOString() : undefined }
          : t
      );
      const result = await updateTodos(updated);
      if (willComplete) {
        await fetch(`/api/leads/${lead._id}/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `Task completed: "${task.taskName}"`, type: "TaskDone" }),
        });
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-activity", lead._id] });
    }
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl font-bold">Tasks — {lead.name}</DialogTitle>
      </DialogHeader>

      {/* Add task row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="New task name..."
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && taskName.trim() && addMutation.mutate()}
          className="flex-1 rounded-xl h-10"
        />
        <div className="flex gap-2">
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 pointer-events-none" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-10 pl-8 pr-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-green-500 w-[150px]"
            />
          </div>
          <Button
            onClick={() => taskName.trim() && addMutation.mutate()}
            disabled={addMutation.isPending}
            className="rounded-xl h-10 px-4 bg-green-600 hover:bg-green-700 text-white shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {(!lead.todos || lead.todos.length === 0) ? (
          <p className="text-sm text-gray-400 text-center py-10">No tasks yet. Add one above!</p>
        ) : (
          lead.todos.map((todo: any, idx: number) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                todo.isCompleted
                  ? "bg-gray-50 dark:bg-gray-800/30 border-gray-100 opacity-60"
                  : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
              }`}
            >
              <button onClick={() => toggleMutation.mutate(idx)} className="shrink-0">
                {todo.isCompleted
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400 transition-colors" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${todo.isCompleted ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>
                  {todo.taskName}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs ${getDayLabelClass(todo.dueDate)}`}>
                    {getDayLabel(todo.dueDate)}
                  </span>
                  {todo.addedToTodo && <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">In My Day</span>}
                  {todo.completedAt && (
                    <span className="text-[10px] text-green-600">
                      ✓ Done {new Date(todo.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setConfirmIdx(idx)}
                className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={confirmIdx !== null}
        onCancel={() => setConfirmIdx(null)}
        onConfirm={() => { if (confirmIdx !== null) deleteMutation.mutate(confirmIdx); setConfirmIdx(null); }}
        title="Delete this task?"
        description="This task will be permanently removed."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
