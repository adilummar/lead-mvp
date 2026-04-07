"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Users, Briefcase, Target, DollarSign, UserCircle, BarChart3,
  Calendar, ChevronDown, ChevronRight, TrendingUp, TrendingDown,
  CheckCircle2, Clock, Phone, FileText, ArrowRightLeft, Tag,
  AlertCircle, ReceiptText, Layers, Activity,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}
function fmtRelative(d: string | Date | null) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  lead_created:           { icon: Users,          color: "text-green-600",  bg: "bg-green-100",  label: "Lead added" },
  lead_contacted:         { icon: Phone,          color: "text-blue-600",   bg: "bg-blue-100",   label: "Contacted" },
  status_changed:         { icon: ArrowRightLeft, color: "text-purple-600", bg: "bg-purple-100", label: "Status" },
  project_created:        { icon: Briefcase,      color: "text-teal-600",   bg: "bg-teal-100",   label: "Project" },
  payment_received:       { icon: TrendingUp,     color: "text-green-700",  bg: "bg-green-100",  label: "Payment" },
  payment_status_changed: { icon: DollarSign,     color: "text-emerald-600",bg: "bg-emerald-100",label: "Payment" },
  expense_added:          { icon: ReceiptText,    color: "text-red-600",    bg: "bg-red-100",    label: "Expense" },
  expense_removed:        { icon: TrendingDown,   color: "text-orange-600", bg: "bg-orange-100", label: "Expense" },
  goal_created:           { icon: Target,         color: "text-indigo-600", bg: "bg-indigo-100", label: "Goal" },
  goal_updated:           { icon: Tag,            color: "text-violet-600", bg: "bg-violet-100", label: "Goal" },
  todo_added:             { icon: Layers,         color: "text-yellow-700", bg: "bg-yellow-100", label: "Task added" },
  todo_scheduled:         { icon: Calendar,       color: "text-orange-600", bg: "bg-orange-100", label: "Scheduled" },
  todo_completed:         { icon: CheckCircle2,   color: "text-green-600",  bg: "bg-green-100",  label: "Done" },
  todo_reopened:          { icon: Clock,          color: "text-gray-500",   bg: "bg-gray-100",   label: "Reopened" },
  todo_unscheduled:       { icon: Calendar,       color: "text-gray-500",   bg: "bg-gray-100",   label: "Removed" },
  member_added:           { icon: UserCircle,     color: "text-teal-600",   bg: "bg-teal-100",   label: "Team" },
  note_added:             { icon: FileText,       color: "text-blue-600",   bg: "bg-blue-100",   label: "Note" },
};

const STATUS_COLORS: Record<string, string> = {
  New: "bg-green-100 text-green-700", Contacted: "bg-blue-100 text-blue-700",
  Proposal: "bg-yellow-100 text-yellow-700", Negotiation: "bg-orange-100 text-orange-700",
  Closed: "bg-green-100 text-green-700", Lost: "bg-red-100 text-red-700",
  Planned: "bg-gray-100 text-gray-700", "In-Progress": "bg-purple-100 text-purple-700",
  Testing: "bg-yellow-100 text-yellow-700", Completed: "bg-green-100 text-green-700",
  Maintenance: "bg-orange-100 text-orange-700", High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700", Low: "bg-green-100 text-green-700",
  "Fully Paid": "bg-green-100 text-green-700", "Partially Paid": "bg-yellow-100 text-yellow-700",
  Unpaid: "bg-red-100 text-red-700",
};

// ── Sub-components ────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ActivityItem({ a }: { a: any }) {
  const cfg = ACTION_CONFIG[a.action] || { icon: Activity, color: "text-gray-500", bg: "bg-gray-100", label: a.action };
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 dark:text-gray-200">{a.message}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{fmtDateTime(a.createdAt)}</p>
      </div>
      <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{fmtRelative(a.createdAt)}</span>
    </div>
  );
}

function ExpandableRow({ children, detail }: { children: React.ReactNode; detail: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        {children}
        <span className="ml-auto shrink-0">
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-50 dark:border-gray-800 px-4 pb-4 pt-3 bg-gray-50/50 dark:bg-gray-800/30">
          {detail}
        </div>
      )}
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[text] || "bg-gray-100 text-gray-700"}`}>
      {text}
    </span>
  );
}

// ── Date Range Picker ────────────────────────────────────
const PRESETS = [
  { label: "Today",       days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days",days: 30 },
  { label: "Last 3 months",days: 90 },
  { label: "All time",    days: 0, all: true },
];

function DateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (f: string, t: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map(p => {
        const today = new Date().toISOString().slice(0, 10);
        const start = p.all ? "" : p.days === 0
          ? today
          : new Date(Date.now() - p.days * 86400000).toISOString().slice(0, 10);
        const active = p.all ? (from === "" && to === "") : (from === start && to === today);
        return (
          <button
            key={p.label}
            onClick={() => onChange(start, p.all ? "" : today)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              active
                ? "bg-green-600 text-white border-green-600"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-400 hover:text-green-700"
            }`}
          >{p.label}</button>
        );
      })}
      <div className="flex items-center gap-1.5 ml-2">
        <input type="date" value={from} onChange={e => onChange(e.target.value, to)}
          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-green-500" />
        <span className="text-gray-400 text-xs">→</span>
        <input type="date" value={to} onChange={e => onChange(from, e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-green-500" />
      </div>
    </div>
  );
}

// ── Tab Panels ────────────────────────────────────────────
function OverviewTab({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-overview", from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ type: "overview", ...(from && { from }), ...(to && { to }) });
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400 text-sm">Loading overview…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Leads Added"    value={data?.leadsAdded ?? 0}    icon={Users}        color="bg-green-600" />
        <StatCard label="Contacted"      value={data?.leadsContacted ?? 0} icon={Phone}       color="bg-blue-600" />
        <StatCard label="Leads Closed"   value={data?.leadsClosed ?? 0}   icon={TrendingUp}   color="bg-emerald-600" />
        <StatCard label="Projects Created" value={data?.projectsCreated ?? 0} icon={Briefcase} color="bg-teal-600" />
        <StatCard label="Tasks Added"    value={data?.tasksAdded ?? 0}    icon={Layers}       color="bg-yellow-600" />
        <StatCard label="Tasks Completed"value={data?.tasksCompleted ?? 0} icon={CheckCircle2} color="bg-green-700" />
        <StatCard label="Projects Done"  value={data?.projectsCompleted ?? 0} icon={Target}   color="bg-purple-600" />
        <StatCard label="Total Events"   value={data?.recentActivities?.length ?? 0} icon={Activity} color="bg-gray-600" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-600" /> Activity Timeline
        </h3>
        <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[420px] overflow-y-auto pr-1">
          {(data?.recentActivities || []).length === 0
            ? <p className="text-gray-400 text-sm text-center py-8">No activity in this period.</p>
            : (data?.recentActivities || []).map((a: any) => <ActivityItem key={a._id} a={a} />)
          }
        </div>
      </div>
    </div>
  );
}

function LeadsTab({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-leads", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/reports?type=leads${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400 text-sm">Loading leads report…</div>;

  return (
    <div className="space-y-3">
      {(!data || data.length === 0) && <p className="text-center py-12 text-gray-400 text-sm">No leads found.</p>}
      {(data || []).map((lead: any) => (
        <ExpandableRow key={lead._id}
          detail={
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
              {lead.activities.length === 0
                ? <p className="text-sm text-gray-400 py-4 text-center">No activity logged yet.</p>
                : lead.activities.map((a: any) => <ActivityItem key={a._id} a={a} />)
              }
            </div>
          }
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {lead.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{lead.name}</span>
                <Badge text={lead.status} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-500 mt-0.5">
                <span>Added: {fmtDate(lead.createdAt)}</span>
                <span>Contacted: {fmtDate(lead.firstContactedAt)}</span>
                <span>Tasks: {lead.todosCompleted}/{lead.todosTotal} done</span>
                <span>Last active: {fmtRelative(lead.lastActivityAt)}</span>
              </div>
            </div>
          </div>
        </ExpandableRow>
      ))}
    </div>
  );
}

function ProjectsTab({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-projects", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/reports?type=projects${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400 text-sm">Loading projects report…</div>;

  return (
    <div className="space-y-3">
      {(!data || data.length === 0) && <p className="text-center py-12 text-gray-400 text-sm">No projects found.</p>}
      {(data || []).map((p: any) => (
        <ExpandableRow key={p._id}
          detail={
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-2 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <p className="text-base font-extrabold text-green-700">{fmt(p.amountPaid)}</p>
                  <p className="text-[10px] text-green-600 font-semibold uppercase">Received</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-red-50 dark:bg-red-900/20">
                  <p className="text-base font-extrabold text-red-600">{fmt(p.expenseTotal)}</p>
                  <p className="text-[10px] text-red-500 font-semibold uppercase">Spent</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-base font-extrabold text-blue-700">{p.tasksDone}/{p.tasksTotal}</p>
                  <p className="text-[10px] text-blue-600 font-semibold uppercase">Tasks Done</p>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-52 overflow-y-auto">
                {p.activities.length === 0
                  ? <p className="text-sm text-gray-400 py-4 text-center">No activity logged yet.</p>
                  : p.activities.map((a: any) => <ActivityItem key={a._id} a={a} />)
                }
              </div>
            </div>
          }
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-teal-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{p.title}</span>
                <Badge text={p.status} />
                <Badge text={p.paymentStatus} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-500 mt-0.5">
                <span>Budget: {fmt(p.totalBudget)}</span>
                <span>Paid: {fmt(p.amountPaid)}</span>
                <span>Tasks: {p.tasksDone}/{p.tasksTotal}</span>
                <span>Created: {fmtDate(p.createdAt)}</span>
              </div>
            </div>
          </div>
        </ExpandableRow>
      ))}
    </div>
  );
}

function GoalsTab({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-goals", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/reports?type=goals${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400 text-sm">Loading goals report…</div>;

  return (
    <div className="space-y-3">
      {(!data || data.length === 0) && <p className="text-center py-12 text-gray-400 text-sm">No goals found.</p>}
      {(data || []).map((g: any) => (
        <ExpandableRow key={g._id}
          detail={
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-52 overflow-y-auto">
              {g.activities.length === 0
                ? <p className="text-sm text-gray-400 py-4 text-center">No activity logged yet.</p>
                : g.activities.map((a: any) => <ActivityItem key={a._id} a={a} />)
              }
            </div>
          }
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-indigo-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{g.title}</span>
                <Badge text={g.priority} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-500 mt-0.5">
                <span>Tasks: {g.subtasksDone}/{g.subtasksTotal} ({g.pct}%)</span>
                {g.deadline && <span>Deadline: {fmtDate(g.deadline)}</span>}
                <span>Created: {fmtDate(g.createdAt)}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-extrabold text-gray-700 dark:text-gray-200">{g.pct}%</p>
              <div className="w-16 bg-gray-100 rounded-full h-1.5 mt-1">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${g.pct}%` }} />
              </div>
            </div>
          </div>
        </ExpandableRow>
      ))}
    </div>
  );
}

function FinanceTab({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-finance", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/reports?type=finance${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400 text-sm">Loading finance report…</div>;

  const events: any[] = data?.events || [];
  const totalExpenses = data?.totalExpenses || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Expenses" value={fmt(totalExpenses)} icon={ReceiptText} color="bg-red-600" />
        <StatCard label="Finance Events" value={events.length} icon={Activity} color="bg-purple-600" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">Finance Activity Log</h3>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[480px] overflow-y-auto px-4">
          {events.length === 0
            ? <p className="text-gray-400 text-sm text-center py-8">No finance activity in this period.</p>
            : events.map((a: any) => (
              <div key={a._id} className="flex items-center gap-3 py-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${a.action === "expense_added" ? "bg-red-100" : "bg-green-100"}`}>
                  {a.action === "expense_added"
                    ? <ReceiptText className="w-3.5 h-3.5 text-red-600" />
                    : <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{a.message}</p>
                  <p className="text-[10px] text-gray-400">{fmtDateTime(a.createdAt)}</p>
                </div>
                {a.meta?.amount && (
                  <span className={`text-sm font-bold shrink-0 ${a.action === "expense_added" ? "text-red-600" : "text-green-600"}`}>
                    {a.action === "expense_added" ? "−" : "+"}{fmt(a.meta.amount)}
                  </span>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function TeamTab({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-team", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/reports?type=team${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400 text-sm">Loading team report…</div>;

  return (
    <div className="space-y-3">
      {(!data || data.length === 0) && <p className="text-center py-12 text-gray-400 text-sm">No team members found.</p>}
      {(data || []).map((m: any) => (
        <div key={m._id} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {m.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{m.name}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.role === "Admin" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{m.role}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-500 mt-0.5">
              <span>{m.email}</span>
              <span>Joined: {fmtDate(m.joinedAt)}</span>
              <span>Leads: {m.leadsAssigned}</span>
              <span>Last active: {fmtRelative(m.lastActive)}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-extrabold text-gray-700 dark:text-gray-200">{m.leadsAssigned}</p>
            <p className="text-[10px] text-gray-400">leads</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Reports View ────────────────────────────────────
type TabKey = "overview" | "leads" | "projects" | "goals" | "finance" | "team";

const TABS: { key: TabKey; label: string; icon: any; color: string; active: string }[] = [
  { key: "overview",  label: "Overview",  icon: BarChart3,  color: "text-gray-600",   active: "bg-gray-700 text-white" },
  { key: "leads",     label: "Leads",     icon: Users,       color: "text-green-600",  active: "bg-green-600 text-white" },
  { key: "projects",  label: "Projects",  icon: Briefcase,   color: "text-teal-600",   active: "bg-teal-600 text-white" },
  { key: "goals",     label: "Goals",     icon: Target,      color: "text-indigo-600", active: "bg-indigo-600 text-white" },
  { key: "finance",   label: "Finance",   icon: DollarSign,  color: "text-red-600",    active: "bg-red-600 text-white" },
  { key: "team",      label: "Team",      icon: UserCircle,  color: "text-blue-600",   active: "bg-blue-600 text-white" },
];

export default function ReportsView() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const today = new Date().toISOString().slice(0, 10);
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(thirtyAgo);
  const [to, setTo]     = useState(today);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1000px] mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Reports</h1>
        <p className="text-gray-500 text-sm sm:text-base mt-1">Time-tracked activity across all modules.</p>
      </div>

      {/* Date Range */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-green-600" />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Date Range</span>
        </div>
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {/* Tab buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(({ key, label, icon: Icon, color, active }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeTab === key
                ? `${active} border-transparent shadow-md`
                : `bg-white dark:bg-gray-900 ${color} border-gray-200 dark:border-gray-700 hover:border-green-300`
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview"  && <OverviewTab  from={from} to={to} />}
      {activeTab === "leads"     && <LeadsTab     from={from} to={to} />}
      {activeTab === "projects"  && <ProjectsTab  from={from} to={to} />}
      {activeTab === "goals"     && <GoalsTab     from={from} to={to} />}
      {activeTab === "finance"   && <FinanceTab   from={from} to={to} />}
      {activeTab === "team"      && <TeamTab      from={from} to={to} />}
    </div>
  );
}
