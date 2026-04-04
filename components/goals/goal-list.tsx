"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Target, Calendar, AlertCircle, FolderOpen, ListTodo, CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";

const goalSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["High", "Medium", "Low"]),
  deadline: z.string().optional(),
});
type GoalFormData = z.infer<typeof goalSchema>;

const priorityColors: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low: "bg-green-100 text-green-700 border-green-200",
};

function GoalForm({ onSuccess, initialData, goalId }: { onSuccess: () => void; initialData?: Partial<GoalFormData>; goalId?: string }) {
  const queryClient = useQueryClient();
  const isEdit = !!goalId;
  const { register, handleSubmit, control, formState: { errors } } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: { priority: "Medium", ...initialData },
  });
  const mutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const url = isEdit ? `/api/goals/${goalId}` : "/api/goals";
      const res = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["goals"] }); onSuccess(); }
  });
  return (
    <>
      <DialogHeader className="mb-4">
        <DialogTitle className="text-xl sm:text-2xl font-bold">{isEdit ? "Edit Goal" : "Add Company Goal"}</DialogTitle>
        <DialogDescription>{isEdit ? "Update goal details." : "Set a high-level objective."}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5"><Label>Goal Title</Label><Input placeholder="E.g. Reach ₹10L revenue" className="rounded-xl h-11" {...register("title")} />{errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}</div>
        <div className="space-y-1.5"><Label>Description</Label><Textarea placeholder="What does success look like?" className="rounded-xl min-h-[80px] resize-none" {...register("description")} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Controller name="priority" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="High">🔴 High</SelectItem><SelectItem value="Medium">🟡 Medium</SelectItem><SelectItem value="Low">🟢 Low</SelectItem></SelectContent>
              </Select>)} />
          </div>
          <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" className="rounded-xl h-11" {...register("deadline")} /></div>
        </div>
        <div className="pt-2"><Button type="submit" disabled={mutation.isPending} className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 font-semibold text-base">{mutation.isPending ? "Saving..." : isEdit ? "Update Goal" : "Save Goal"}</Button></div>
      </form>
    </>
  );
}

function GoalSubtaskModal({ goal }: { goal: any }) {
  const queryClient = useQueryClient();
  const [taskName, setTaskName] = useState("");

  const updateSubtasks = async (subtasks: any[]) => {
    const res = await fetch(`/api/goals/${goal._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subtasks }) });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  };

  const addMutation = useMutation({
    mutationFn: async () => updateSubtasks([...(goal.subtasks || []), { taskName, isCompleted: false, priority: "Medium", assignedToDay: "Later", addedToTodo: false }]),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["goals"] }); setTaskName(""); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (idx: number) => updateSubtasks(goal.subtasks.filter((_: any, i: number) => i !== idx)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] })
  });

  const toggleMutation = useMutation({
    mutationFn: async (idx: number) => updateSubtasks(goal.subtasks.map((t: any, i: number) => i === idx ? { ...t, isCompleted: !t.isCompleted } : t)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] })
  });

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle className="text-lg sm:text-xl font-bold">📋 {goal.title}</DialogTitle></DialogHeader>
      <div className="flex gap-2">
        <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && taskName && addMutation.mutate()} placeholder="Add a sub-task..." className="rounded-xl flex-1 h-10" />
        <Button onClick={() => taskName && addMutation.mutate()} className="rounded-xl h-10 bg-green-600 text-white px-4 shrink-0"><Plus className="w-4 h-4" /></Button>
      </div>
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {(goal.subtasks || []).length === 0 ? <p className="text-sm text-gray-400 text-center py-10">No sub-tasks yet.</p> : (
          goal.subtasks.map((t: any, idx: number) => (
            <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${t.isCompleted ? "bg-gray-50 border-gray-100 opacity-60" : "border-gray-100 dark:border-gray-800"}`}>
              <button onClick={() => toggleMutation.mutate(idx)} className="shrink-0">
                {t.isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400 transition-colors" />}
              </button>
              <span className={`text-sm font-medium flex-1 truncate ${t.isCompleted ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>{t.taskName}</span>
              {t.addedToTodo && <span className="text-xs text-green-600 font-semibold shrink-0">{t.assignedToDay}</span>}
              <button onClick={() => { if (window.confirm("Delete this task?")) deleteMutation.mutate(idx); }} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function GoalList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data: goals, isLoading, error } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => { const res = await fetch("/api/goals"); if (!res.ok) throw new Error("Failed"); return res.json(); },
    retry: 1
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/goals/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] })
  });

  if (isLoading) return <div className="flex flex-col items-center justify-center py-24 gap-4"><div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /><p className="text-gray-500 animate-pulse">Loading goals...</p></div>;
  if (error) return <div className="p-8 text-center rounded-2xl border border-red-100 bg-red-50"><AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" /><h3 className="text-base font-bold text-red-800">Connection Error</h3></div>;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Company Goals</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">Set and track high-level objectives.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditingGoal(null); }}>
          <DialogTrigger onClick={() => { setEditingGoal(null); setIsFormOpen(true); }} className="shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl px-4 h-10 text-sm font-semibold shadow-md inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Goal</span><span className="sm:hidden">Add</span>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[480px] rounded-2xl border-none shadow-2xl p-5 sm:p-6">
            <GoalForm onSuccess={() => { setIsFormOpen(false); setEditingGoal(null); }} initialData={editingGoal ? { title: editingGoal.title, description: editingGoal.description, priority: editingGoal.priority, deadline: editingGoal.deadline?.slice(0, 10) } : undefined} goalId={editingGoal?._id} />
          </DialogContent>
        </Dialog>
      </div>

      {!goals || goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <Target className="w-14 h-14 text-gray-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">No goals yet</h3>
          <p className="text-gray-500 mt-1 mb-6 text-sm">Define company objectives to get started.</p>
          <Button onClick={() => setIsFormOpen(true)} variant="outline" className="rounded-xl px-8 text-sm">Add First Goal</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {goals.map((goal: any) => {
            const total = goal.subtasks?.length || 0;
            const done = goal.subtasks?.filter((t: any) => t.isCompleted).length || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={goal._id} className="group flex flex-col p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg active:scale-[0.99] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-bold text-base sm:text-lg line-clamp-2 flex-1">{goal.title}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className={`text-xs font-semibold rounded-full border px-2.5 ${priorityColors[goal.priority]}`}>{goal.priority}</Badge>
                    <button onClick={() => { setEditingGoal(goal); setIsFormOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { if (window.confirm(`Delete goal "${goal.title}"?`)) deleteMutation.mutate(goal._id); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {goal.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{goal.description}</p>}
                {goal.deadline && <div className="flex items-center text-xs text-gray-500 mb-3 gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0" />{new Date(goal.deadline).toLocaleDateString()}</div>}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5"><span>{done}/{total} tasks</span><span className="font-semibold">{pct}%</span></div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div>
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end mt-auto">
                  <Dialog>
                    <DialogTrigger className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
                      <ListTodo className="h-3.5 w-3.5" /> Sub-tasks
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-5 sm:p-6">
                      <GoalSubtaskModal goal={goal} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
