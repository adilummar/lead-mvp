"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, Layers, Briefcase, Target, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TodoSkeleton } from "@/components/ui/skeleton";

const sourceColors: Record<string, string> = {
  Lead: "bg-green-100 text-green-700", Project: "bg-teal-100 text-teal-700", Goal: "bg-emerald-100 text-emerald-700",
};
const priorityDot: Record<string, string> = { High: "bg-red-500", Medium: "bg-yellow-500", Low: "bg-green-500" };
const sourceIcon: Record<string, any> = { Lead: Layers, Project: Briefcase, Goal: Target };

function fmtDueDate(dueDate?: string | null): string {
  if (!dueDate) return "";
  const d = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const due = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (due.getTime() === today.getTime()) return "Today";
  if (due.getTime() === tomorrow.getTime()) return "Tomorrow";
  if (due < today) return `Overdue · ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function computeBucket(task: any): "Overdue" | "Today" | "Tomorrow" | "Later" {
  if (!task.dueDate) return task.assignedToDay === "Today" ? "Today" : task.assignedToDay === "Tomorrow" ? "Tomorrow" : "Later";
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowMidnight = new Date(todayMidnight); tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
  const due = new Date(task.dueDate);
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  if (dueMidnight < todayMidnight) return "Overdue";
  if (dueMidnight.getTime() === todayMidnight.getTime()) return "Today";
  if (dueMidnight.getTime() === tomorrowMidnight.getTime()) return "Tomorrow";
  return "Later";
}

export default function MasterTodoView() {
  const queryClient = useQueryClient();

  const { data: todos, isLoading } = useQuery({
    queryKey: ["master-todos"],
    queryFn: async () => {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    retry: 1,
    refetchInterval: 30000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (todo: any) => {
      const res = await fetch("/api/todos/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: todo.source, sourceId: todo.sourceId, taskId: todo._id }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-todos"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (todo: any) => {
      const res = await fetch("/api/todos/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: todo.source, sourceId: todo.sourceId, taskId: todo._id, addedToTodo: false, assignedToDay: "Later" }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-todos"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });

  if (isLoading) return <TodoSkeleton />;

  const grouped: Record<string, any[]> = { Overdue: [], Today: [], Tomorrow: [], Later: [] };
  (todos || []).forEach((t: any) => {
    const bucket = computeBucket(t);
    (grouped[bucket] || grouped["Later"]).push(t);
  });

  const totalDone = (todos || []).filter((t: any) => t.isCompleted).length;
  const totalAll  = (todos || []).length;
  const pct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
  const overdueCount = grouped["Overdue"].filter((t: any) => !t.isCompleted).length;

  const sectionConfig: Record<string, { label: string; badge: string; icon?: any }> = {
    Overdue:  { label: "Overdue",   badge: "bg-red-100 text-red-700 border-red-200",    icon: AlertTriangle },
    Today:    { label: "Today",     badge: "bg-orange-100 text-orange-700 border-orange-200" },
    Tomorrow: { label: "Tomorrow",  badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    Later:    { label: "Upcoming",  badge: "bg-gray-100 text-gray-600 border-gray-200" },
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-1">My Day</h1>
        <p className="text-gray-500 text-sm sm:text-base">Tasks scheduled from your leads, projects & goals.</p>
      </div>

      {/* Overdue alert banner */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">{overdueCount} overdue task{overdueCount > 1 ? "s" : ""} — please reschedule or complete them.</p>
        </div>
      )}

      {/* Progress banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-green-200 text-xs font-medium mb-0.5">Overall Progress</p>
            <p className="text-2xl sm:text-3xl font-extrabold">
              {totalDone} <span className="text-lg font-medium text-green-200">/ {totalAll} done</span>
            </p>
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold text-white/20">{pct}%</div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        {totalAll > 0 && totalDone === totalAll && (
          <p className="text-green-100 text-sm font-semibold mt-3 text-center">🎉 All done! Great work!</p>
        )}
      </div>

      {totalAll === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <CheckCircle2 className="w-14 h-14 text-gray-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">Nothing scheduled</h3>
          <p className="text-gray-500 mt-1 text-sm text-center px-6">
            Go to <a href="/overview" className="text-green-600 font-semibold underline">Overview</a> and click &quot;Add to My Day&quot; on any sub-task.
          </p>
        </div>
      )}

      {(["Overdue", "Today", "Tomorrow", "Later"] as const).map((section) => {
        const tasks = grouped[section];
        if (tasks.length === 0) return null;
        const cfg = sectionConfig[section];
        const SectionIcon = cfg.icon;
        const doneCnt = tasks.filter((t: any) => t.isCompleted).length;

        return (
          <div key={section}>
            <div className="flex items-center gap-3 mb-3">
              {SectionIcon && <SectionIcon className="w-4 h-4 text-red-500" />}
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{cfg.label}</h2>
              <Badge variant="outline" className={`rounded-full border font-semibold px-2.5 text-xs ${cfg.badge}`}>
                {tasks.length}
              </Badge>
              <span className="text-xs text-gray-400 ml-auto">{doneCnt}/{tasks.length} done</span>
            </div>

            <div className="space-y-2">
              {tasks.map((todo: any, idx: number) => {
                const Icon = sourceIcon[todo.source] || Clock;
                const dueDateLabel = fmtDueDate(todo.dueDate);
                const isOverdue = section === "Overdue" && !todo.isCompleted;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-all duration-200 ${
                      todo.isCompleted
                        ? "border-gray-100 bg-gray-50/50 dark:bg-gray-900/30 opacity-70"
                        : isOverdue
                          ? "border-red-200 bg-red-50/50 dark:bg-red-900/10"
                          : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
                    }`}
                  >
                    <button
                      onClick={() => toggleMutation.mutate(todo)}
                      disabled={toggleMutation.isPending}
                      title={todo.isCompleted ? "Mark as not done" : "Mark as done"}
                      className="shrink-0 group disabled:opacity-50 transition-transform active:scale-90"
                    >
                      {todo.isCompleted
                        ? <CheckCircle2 className="w-5 h-5 text-green-500 group-hover:text-green-600 transition-colors" />
                        : <Circle className="w-5 h-5 text-gray-300 group-hover:text-green-400 transition-colors" />
                      }
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate transition-all ${
                        todo.isCompleted ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-100"
                      }`}>
                        {todo.taskName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Icon className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-400 truncate">{todo.sourceName}</span>
                        {dueDateLabel && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                            isOverdue ? "text-red-600 bg-red-100" : "text-gray-500 bg-gray-100"
                          }`}>
                            {dueDateLabel}
                          </span>
                        )}
                        {todo.completedAt && (
                          <span className="text-[10px] text-green-600 font-medium">
                            ✓ {new Date(todo.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${priorityDot[todo.priority] || "bg-gray-400"}`}
                        title={`${todo.priority} priority`}
                      />
                      <Badge className={`text-[10px] font-semibold rounded-full px-2 hidden sm:inline-flex ${sourceColors[todo.source] || ""}`}>
                        {todo.source}
                      </Badge>
                      <button
                        onClick={() => removeMutation.mutate(todo)}
                        disabled={removeMutation.isPending}
                        title="Remove from My Day"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
