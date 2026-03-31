"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";

export default function LeadSubtasks({ lead }: { lead: any }) {
  const queryClient = useQueryClient();
  const [taskName, setTaskName] = useState("");
  const [assignedToDay, setAssignedToDay] = useState("Later");

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
      const newTodo = { taskName, assignedToDay, isCompleted: false, priority: "Medium", addedToTodo: false };
      return updateTodos([...(lead.todos || []), newTodo]);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leads"] }); setTaskName(""); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (idx: number) => {
      const updated = lead.todos.filter((_: any, i: number) => i !== idx);
      return updateTodos(updated);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] })
  });

  const toggleMutation = useMutation({
    mutationFn: async (idx: number) => {
      const updated = lead.todos.map((t: any, i: number) =>
        i === idx ? { ...t, isCompleted: !t.isCompleted } : t
      );
      return updateTodos(updated);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] })
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl font-bold">Tasks — {lead.name}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="New task name..."
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && taskName.trim() && addMutation.mutate()}
          className="flex-1 rounded-xl h-10"
        />
        <div className="flex gap-2">
          <Select value={assignedToDay} onValueChange={(v) => setAssignedToDay(v || "Later")}>
            <SelectTrigger className="w-[110px] rounded-xl h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="Tomorrow">Tomorrow</SelectItem>
              <SelectItem value="Later">Later</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => taskName.trim() && addMutation.mutate()} disabled={addMutation.isPending} className="rounded-xl h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {(!lead.todos || lead.todos.length === 0) ? (
          <p className="text-sm text-gray-400 text-center py-10">No tasks yet. Add one above!</p>
        ) : (
          lead.todos.map((todo: any, idx: number) => (
            <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${todo.isCompleted ? "bg-gray-50 dark:bg-gray-800/30 border-gray-100 opacity-60" : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"}`}>
              <button onClick={() => toggleMutation.mutate(idx)} className="shrink-0">
                {todo.isCompleted
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400 transition-colors" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${todo.isCompleted ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>{todo.taskName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{todo.assignedToDay} {todo.addedToTodo && "· In My Day"}</p>
              </div>
              <button onClick={() => { if (window.confirm("Delete this task?")) deleteMutation.mutate(idx); }} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
