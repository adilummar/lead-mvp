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

export default function ProjectSubtasks({ project }: { project: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [taskName, setTaskName] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);

  const updateTasks = async (tasks: any[]) => {
    const res = await fetch(`/api/projects/${project._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const dueDateISO = dueDate ? new Date(dueDate + "T00:00:00").toISOString() : undefined;
      let assignedToDay = "Later";
      if (dueDate) {
        const label = getDayLabel(dueDateISO);
        if (label === "Today") assignedToDay = "Today";
        else if (label === "Tomorrow") assignedToDay = "Tomorrow";
      }
      const newTask = {
        taskName,
        assignedToDay,
        dueDate: dueDateISO,
        createdDate: new Date().toISOString(),
        isCompleted: false,
        priority: "Medium",
        addedToTodo: false,
      };
      return updateTasks([...(project.tasks || []), newTask]);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); setTaskName(""); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (idx: number) => {
      const updated = project.tasks.filter((_: any, i: number) => i !== idx);
      return updateTasks(updated);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); toast.success("Task removed"); },
  });

  const toggleMutation = useMutation({
    mutationFn: async (idx: number) => {
      const task = project.tasks[idx];
      const willComplete = !task.isCompleted;
      const updated = project.tasks.map((t: any, i: number) =>
        i === idx ? { ...t, isCompleted: willComplete, completedAt: willComplete ? new Date().toISOString() : undefined } : t
      );
      return updateTasks(updated);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const done  = (project.tasks || []).filter((t: any) => t.isCompleted).length;
  const total = (project.tasks || []).length;

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl font-bold">Tasks — {project.title}</DialogTitle>
        {total > 0 && <p className="text-sm text-gray-500">{done}/{total} completed</p>}
      </DialogHeader>

      {total > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((done / total) * 100)}%` }}
          />
        </div>
      )}

      {/* Add task row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="New task name..."
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && taskName.trim() && addMutation.mutate()}
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
        {(!project.tasks || project.tasks.length === 0) ? (
          <p className="text-sm text-gray-400 text-center py-10">No tasks yet. Add one above!</p>
        ) : (
          project.tasks.map((task: any, idx: number) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                task.isCompleted
                  ? "bg-gray-50 dark:bg-gray-800/30 border-gray-100 opacity-60"
                  : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
              }`}
            >
              <button onClick={() => toggleMutation.mutate(idx)} className="shrink-0">
                {task.isCompleted
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400 transition-colors" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${task.isCompleted ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>
                  {task.taskName}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs ${getDayLabelClass(task.dueDate)}`}>
                    {getDayLabel(task.dueDate)}
                  </span>
                  {task.addedToTodo && <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">In My Day</span>}
                  {task.completedAt && (
                    <span className="text-[10px] text-green-600">
                      ✓ Done {new Date(task.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
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
