"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, Layers, Briefcase, Target, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sourceColors: Record<string, string> = {
  Lead: "bg-blue-100 text-blue-700", Project: "bg-purple-100 text-purple-700", Goal: "bg-indigo-100 text-indigo-700",
};
const dayBadge: Record<string, string> = {
  Today: "bg-orange-100 text-orange-700 border-orange-200",
  Tomorrow: "bg-yellow-100 text-yellow-700 border-yellow-200",
};
const priorityDot: Record<string, string> = { High: "bg-red-500", Medium: "bg-yellow-500", Low: "bg-green-500" };
const sourceIcon: Record<string, any> = { Lead: Layers, Project: Briefcase, Goal: Target };

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

  // Toggle done / undone
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

  // Remove from My Day
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

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 animate-pulse">Loading My Day...</p>
    </div>
  );

  const grouped: Record<string, any[]> = { Today: [], Tomorrow: [], Later: [] };
  (todos || []).forEach((t: any) => { (grouped[t.assignedToDay] || grouped["Later"]).push(t); });

  const totalDone = (todos || []).filter((t: any) => t.isCompleted).length;
  const totalAll  = (todos || []).length;
  const pct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-1">My Day</h1>
        <p className="text-gray-500 text-sm sm:text-base">Tasks you've scheduled from the Overview.</p>
      </div>

      {/* Progress banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-blue-200 text-xs font-medium mb-0.5">Overall Progress</p>
            <p className="text-2xl sm:text-3xl font-extrabold">
              {totalDone} <span className="text-lg font-medium text-blue-200">/ {totalAll} done</span>
            </p>
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold text-white/20">{pct}%</div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        {totalAll > 0 && totalDone === totalAll && (
          <p className="text-blue-100 text-sm font-semibold mt-3 text-center">🎉 All done! Great work!</p>
        )}
      </div>

      {totalAll === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <CheckCircle2 className="w-14 h-14 text-gray-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">Nothing scheduled</h3>
          <p className="text-gray-500 mt-1 text-sm text-center px-6">
            Go to <a href="/overview" className="text-blue-600 font-semibold underline">Overview</a> and click "Add to My Day" on any sub-task.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([day, tasks]) => tasks.length === 0 ? null : (
        <div key={day}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{day === "Later" ? "Upcoming" : day}</h2>
            <Badge variant="outline" className={`rounded-full border font-semibold px-2.5 text-xs ${dayBadge[day] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {tasks.length}
            </Badge>
            {day !== "Later" && (
              <span className="text-xs text-gray-400 ml-auto">
                {tasks.filter((t: any) => t.isCompleted).length}/{tasks.length} done
              </span>
            )}
          </div>

          <div className="space-y-2">
            {tasks.map((todo: any, idx: number) => {
              const Icon = sourceIcon[todo.source] || Clock;
              const isToggling = toggleMutation.isPending;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-all duration-200 ${
                    todo.isCompleted
                      ? "border-gray-100 bg-gray-50/50 dark:bg-gray-900/30 opacity-70"
                      : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
                  }`}
                >
                  {/* ✅ Clickable toggle button */}
                  <button
                    onClick={() => toggleMutation.mutate(todo)}
                    disabled={isToggling}
                    title={todo.isCompleted ? "Mark as not done" : "Mark as done"}
                    className="shrink-0 group disabled:opacity-50 transition-transform active:scale-90"
                  >
                    {todo.isCompleted
                      ? <CheckCircle2 className="w-5 h-5 text-green-500 group-hover:text-green-600 transition-colors" />
                      : <Circle className="w-5 h-5 text-gray-300 group-hover:text-green-400 transition-colors" />
                    }
                  </button>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate transition-all ${
                      todo.isCompleted ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-100"
                    }`}>
                      {todo.taskName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Icon className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-400 truncate">{todo.sourceName}</span>
                    </div>
                  </div>

                  {/* Priority + source + remove */}
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
      ))}
    </div>
  );
}
