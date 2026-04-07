"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { OverviewSkeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, Target, ChevronDown, ChevronRight, ChevronUp, CheckCircle2, Circle, AlertCircle, CalendarCheck, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ── Types ──────────────────────────────────────────
type TabType = "leads" | "projects" | "goals";
interface SubTask { _id: string; taskName: string; isCompleted: boolean; priority: "High"|"Medium"|"Low"; assignedToDay: "Today"|"Tomorrow"|"Later"; addedToTodo: boolean; dueDate?: string; assignedToUser?: string; }
interface Lead { _id: string; name: string; status: string; todos: SubTask[] }
interface Project { _id: string; title: string; status: string; tasks: SubTask[] }
interface Goal { _id: string; title: string; priority: string; subtasks: SubTask[] }
interface OverviewData { leads: Lead[]; projects: Project[]; goals: Goal[]; team: any[]; }

// ── Constants ─────────────────────────────────────
const PREVIEW = 3;

const statusColor: Record<string, string> = {
  New: "bg-green-100 text-green-700 border-green-200", Contacted: "bg-purple-100 text-purple-700 border-purple-200",
  Proposal: "bg-yellow-100 text-yellow-700 border-yellow-200", Negotiation: "bg-orange-100 text-orange-700 border-orange-200",
  Closed: "bg-green-100 text-green-700 border-green-200", Lost: "bg-red-100 text-red-700 border-red-200",
  Planned: "bg-green-100 text-green-700 border-green-200", "In-Progress": "bg-purple-100 text-purple-700 border-purple-200",
  Testing: "bg-yellow-100 text-yellow-700 border-yellow-200", Completed: "bg-green-100 text-green-700 border-green-200",
  Maintenance: "bg-orange-100 text-orange-700 border-orange-200",
  High: "bg-red-100 text-red-700 border-red-200", Medium: "bg-yellow-100 text-yellow-700 border-yellow-200", Low: "bg-green-100 text-green-700 border-green-200",
};

const priorityDot: Record<string, string> = { High: "bg-red-500", Medium: "bg-yellow-500", Low: "bg-green-500" };

// ── Schedule Button + Inline Panel ──────────────────
function ScheduleButton({ task, source, sourceId, team }: {
  task: SubTask; source: string; sourceId: string; team: any[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  const close = () => { setOpen(false); };

  const scheduleMutation = useMutation({
    mutationFn: async ({ priority, userId }: { priority: string; userId: string; }) => {
      const dueDateISO = new Date(dueDate + "T00:00:00").toISOString();
      const res = await fetch("/api/todos/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, sourceId, taskId: task._id, addedToTodo: true, dueDate: dueDateISO, priority, assignedToUser: userId || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["master-todos"] });
      close();
    }
  });

  const unscheduleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/todos/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, sourceId, taskId: task._id, addedToTodo: false, assignedToDay: "Later" }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["master-todos"] });
    }
  });

  if (task.addedToTodo) {
    // Show scheduled date label
    const dLabel = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      : task.assignedToDay;
    return (
      <button
        onClick={() => unscheduleMutation.mutate()}
        disabled={unscheduleMutation.isPending}
        title="Scheduled — click to remove from My Day"
        className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-red-50 hover:text-red-600 px-2.5 py-1.5 rounded-lg border border-green-200 hover:border-red-200 transition-all shrink-0"
      >
        <CalendarCheck className="w-3.5 h-3.5" />
        <span>{dLabel}</span>
      </button>
    );
  }

  return (
    <>
      {/* Invisible backdrop to close panel on outside click */}
      {open && (
        <div className="fixed inset-0 z-30" onClick={close} aria-hidden />
      )}

      <div className="relative shrink-0 z-40">
        <button
          onClick={() => { setOpen(v => !v); }}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
            open
              ? "bg-green-700 text-white border-green-700"
              : "text-gray-500 bg-gray-50 hover:bg-green-50 hover:text-green-700 border-gray-200 hover:border-green-200"
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{open ? "Cancel" : "Add to My Day"}</span>
          <span className="sm:hidden">{open ? "✕" : "+"}</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 min-w-[210px] py-1">
            <p className="text-[10px] font-bold text-gray-400 px-4 pt-2.5 pb-1 uppercase tracking-widest">Schedule for date</p>
            <div className="px-4 py-2">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1.5 focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2">
              <p className="text-[10px] font-bold text-gray-400 pb-1 uppercase tracking-widest">Assign Team</p>
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="w-full text-sm font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 focus:outline-none focus:border-green-500"
              >
                <option value="">Myself</option>
                {team.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <p className="text-[10px] font-bold text-gray-400 px-4 pt-1 pb-1 uppercase tracking-widest">Set Priority</p>
            {(["High","Medium","Low"] as const).map(p => (
              <button
                key={p}
                onClick={() => scheduleMutation.mutate({ priority: p, userId: selectedUser })}
                disabled={scheduleMutation.isPending || !dueDate}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityDot[p]}`} />
                {scheduleMutation.isPending ? "Saving..." : p}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Sub-task row ────────────────────────────────────
function TaskRow({ task, source, sourceId, team }: { task: SubTask; source: string; sourceId: string; team: any[]; }) {
  const assignedUserName = task.assignedToUser ? team.find(u => u._id === task.assignedToUser)?.name : null;

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${task.isCompleted ? "bg-gray-50 border-gray-100 opacity-60" : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"}`}>
      {task.isCompleted
        ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        : <Circle className="w-4 h-4 text-gray-300 shrink-0" />}
      <div className="flex-1 min-w-0 flex flex-col">
        <p className={`text-sm font-medium truncate ${task.isCompleted ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-100"}`}>{task.taskName}</p>
        {assignedUserName && <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">👤 {assignedUserName}</span>}
      </div>
      <ScheduleButton task={task} source={source} sourceId={sourceId} team={team} />
    </div>
  );
}

// ── Add Subtask Row ─────────────────────────────────
function AddSubtaskRow({ source, sourceId }: { source: string; sourceId: string }) {
  const queryClient = useQueryClient();
  const [taskName, setTaskName] = useState("");
  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/overview/subtask", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, sourceId, taskName: name })
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      setTaskName("");
    }
  });

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
      <Circle className="w-4 h-4 text-gray-300 shrink-0" />
      <input
        type="text"
        placeholder="Add a new subtask..."
        value={taskName}
        onChange={e => setTaskName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && taskName.trim()) mutation.mutate(taskName.trim()); }}
        disabled={mutation.isPending}
        className="text-sm font-medium flex-1 min-w-0 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder-gray-400"
      />
      {taskName.trim() && (
        <button
          onClick={() => mutation.mutate(taskName.trim())}
          disabled={mutation.isPending}
          className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded-md shrink-0 transition-colors"
        >
          {mutation.isPending ? "Adding..." : "Add"}
        </button>
      )}
    </div>
  );
}

// ── Expandable item card ────────────────────────────
function ItemCard({ title, badge, subtasks, source, sourceId, taskField, team }: {
  title: string; badge: string; subtasks: SubTask[]; source: string; sourceId: string; taskField: string; team: any[];
}) {
  const [expanded, setExpanded] = useState(false);
  const scheduledCount = subtasks.filter(t => t.addedToTodo).length;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 transition-colors text-left">
        <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{title}</span>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={`text-xs font-semibold rounded-full border px-2 ${statusColor[badge] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{badge}</Badge>
          <span className="text-xs text-gray-400">{subtasks.length} tasks{scheduledCount > 0 && <span className="text-green-600 font-semibold ml-1">· {scheduledCount} in My Day</span>}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-gray-50 dark:border-gray-800 px-4 pb-4 pt-3 space-y-2">
          {subtasks.length === 0
            ? <p className="text-sm text-gray-400 text-center py-5">No sub-tasks yet.</p>
            : subtasks.map(task => <TaskRow key={task._id} task={task} source={source} sourceId={sourceId} team={team} />)
          }
          <AddSubtaskRow source={source} sourceId={sourceId} />
        </div>
      )}
    </div>
  );
}

// ── Section with "Show More" ────────────────────────
function Section<T extends { _id: string }>({ items, renderItem }: { items: T[]; renderItem: (item: T) => React.ReactNode }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, PREVIEW);
  const hidden = items.length - PREVIEW;

  return (
    <div className="space-y-3">
      {items.length === 0
        ? <div className="text-center py-16 text-gray-400 text-sm">Nothing here yet.</div>
        : visible.map(item => renderItem(item))
      }
      {items.length > PREVIEW && (
        <button onClick={() => setShowAll(v => !v)} className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800 py-2 rounded-xl hover:bg-green-50 transition-colors">
          {showAll ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> Show {hidden} more</>}
        </button>
      )}
    </div>
  );
}

// ── Main Overview ───────────────────────────────────
export default function OverviewView() {
  const [activeTab, setActiveTab] = useState<TabType>("leads");

  const { data, isLoading, error } = useQuery<OverviewData>({
    queryKey: ["overview"],
    queryFn: async () => {
      const [overviewRes, teamRes] = await Promise.all([
        fetch("/api/overview"),
        fetch("/api/team")
      ]);
      if (!overviewRes.ok || !teamRes.ok) throw new Error("Failed");
      const overviewData = await overviewRes.json();
      const teamData = await teamRes.json();
      return { ...overviewData, team: teamData };
    },
    retry: 1, refetchInterval: 30000,
  });

  const tabs: { key: TabType; label: string; icon: any; color: string; activeClass: string }[] = [
    { key: "leads",    label: "Leads",    icon: Users,    color: "text-green-600",   activeClass: "bg-green-600 text-white shadow-md shadow-green-200" },
    { key: "projects", label: "Projects", icon: Briefcase, color: "text-purple-600", activeClass: "bg-purple-600 text-white shadow-md shadow-purple-200" },
    { key: "goals",    label: "Goals",    icon: Target,   color: "text-indigo-600", activeClass: "bg-indigo-600 text-white shadow-md shadow-indigo-200" },
  ];

  if (isLoading) return <OverviewSkeleton />;

  if (error) return (
    <div className="p-8 text-center rounded-2xl border border-red-100 bg-red-50">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <h3 className="text-base font-bold text-red-800">Connection Error</h3>
      <p className="text-sm text-red-600">Restart npm run dev.</p>
    </div>
  );

  const { leads = [], projects = [], goals = [] } = data || {};
  const allTasks = [...leads.flatMap(l => l.todos), ...projects.flatMap(p => p.tasks), ...goals.flatMap(g => g.subtasks)];
  const totalScheduled = allTasks.filter(t => t.addedToTodo).length;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Overview</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">All items in one place. Schedule tasks to My Day.</p>
        </div>
        {totalScheduled > 0 && (
          <a href="/todos" className="shrink-0 flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4 py-2.5 rounded-xl shadow-md transition-all">
            <CalendarCheck className="w-4 h-4" /> My Day ({totalScheduled})
          </a>
        )}
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl">
        {tabs.map(({ key, label, icon: Icon, color, activeClass }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === key ? activeClass : `text-gray-500 hover:text-gray-700 hover:bg-white/60 dark:hover:bg-gray-700`
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.charAt(0)}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700 text-gray-600"}`}>
              {key === "leads" ? leads.length : key === "projects" ? projects.length : goals.length}
            </span>
          </button>
        ))}
      </div>

      {/* Hint */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
        <CalendarClock className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
        <p className="text-xs text-green-700 dark:text-green-400">
          Expand any item to create or view sub-tasks. Click <strong>"Add to My Day"</strong> on a sub-task to choose the assignable team member and priority.
          Scheduled tasks appear in the <a href="/todos" className="underline font-bold">Master To-Do</a> list.
        </p>
      </div>

      {/* Active section content */}
      {activeTab === "leads" && (
        <Section
          items={leads}
          renderItem={(lead) => (
            <ItemCard key={lead._id} title={lead.name} badge={lead.status} subtasks={lead.todos}
              source="Lead" sourceId={lead._id} taskField="todos" team={data?.team || []} />
          )}
        />
      )}
      {activeTab === "projects" && (
        <Section
          items={projects}
          renderItem={(project) => (
            <ItemCard key={project._id} title={project.title} badge={project.status} subtasks={project.tasks}
              source="Project" sourceId={project._id} taskField="tasks" team={data?.team || []} />
          )}
        />
      )}
      {activeTab === "goals" && (
        <Section
          items={goals}
          renderItem={(goal) => (
            <ItemCard key={goal._id} title={goal.title} badge={goal.priority} subtasks={goal.subtasks}
              source="Goal" sourceId={goal._id} taskField="subtasks" team={data?.team || []} />
          )}
        />
      )}
    </div>
  );
}
