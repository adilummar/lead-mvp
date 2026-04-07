"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Wallet, Banknote, Plus, ChevronDown, ChevronRight, Trash2, ReceiptText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinanceSkeleton } from "@/components/ui/skeleton";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/providers/toast-context";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const paymentColors: Record<string, string> = {
  "Unpaid": "bg-red-100 text-red-700",
  "Partially Paid": "bg-yellow-100 text-yellow-700",
  "Fully Paid": "bg-green-100 text-green-700",
};

// ── Stat Card ──────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, trend }: {
  label: string; value: string; sub?: string; icon: any;
  iconBg: string; iconColor: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="relative p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-4 translate-x-4 ${iconBg}`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</p>
      {sub && <p className={`text-xs mt-1 font-medium ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}

// ── Add Expense Modal ──────────────────────────────────
function AddExpenseModal({ projects }: { projects: any[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/finance/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, amount: Number(amount), desc }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false); setProjectId(""); setAmount(""); setDesc("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-md transition-all">
        <Plus className="w-4 h-4" /> Add Expense
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[440px] rounded-2xl border-none shadow-2xl p-5 sm:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold">Record Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={(val) => setProjectId(val || "")}>
              <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select project..." /></SelectTrigger>
              <SelectContent>
                {projects.map((p: any) => (
                  <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input type="number" placeholder="0.00" className="rounded-xl h-11" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input placeholder="E.g. Design tools, Labour..." className="rounded-xl h-11" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!projectId || !amount || !desc || mutation.isPending}
            className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {mutation.isPending ? "Saving..." : "Record Expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Custom Tooltip ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 shadow-xl text-sm">
      <p className="font-bold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {fmt(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ── Project Expense Row ────────────────────────────────
function ProjectFinanceRow({ p }: { p: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [confirmExpIdx, setConfirmExpIdx] = useState<number | null>(null);
  const paidPct = p.totalBudget > 0 ? Math.round((p.amountPaid / p.totalBudget) * 100) : 0;

  const deleteExpense = useMutation({
    mutationFn: async (index: number) => {
      const res = await fetch("/api/finance/expense", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: p._id, index }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["finance"] }); toast.success("Expense removed"); },
  });

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{p.title}</span>
            <Badge className={`text-[10px] rounded-full px-2 font-semibold shrink-0 ${paymentColors[p.paymentStatus]}`}>{p.paymentStatus}</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="text-green-600 font-semibold">↑ {fmt(p.amountPaid)} received</span>
            <span className="text-orange-500 font-semibold">↓ {fmt(p.expenseTotal)} spent</span>
            {p.amountLeft > 0 && <span className="text-gray-400">({fmt(p.amountLeft)} outstanding)</span>}
          </div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full" style={{ width: `${paidPct}%` }} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-sm font-bold ${(p.amountPaid - p.expenseTotal) >= 0 ? "text-green-600" : "text-red-500"}`}>
            {fmt(p.amountPaid - p.expenseTotal)}
          </p>
          <p className="text-xs text-gray-400">net</p>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-50 dark:border-gray-800 px-4 pb-4 pt-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Expenses</p>
          {p.expenses.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No expenses recorded.</p>
          ) : (
            <div className="space-y-1.5">
              {p.expenses.map((exp: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{exp.desc}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-red-600">{fmt(exp.amount)}</span>
                    <button
                      onClick={() => setConfirmExpIdx(idx)}
                      className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmExpIdx !== null}
        onCancel={() => setConfirmExpIdx(null)}
        onConfirm={() => { if (confirmExpIdx !== null) deleteExpense.mutate(confirmExpIdx); setConfirmExpIdx(null); }}
        title="Remove this expense?"
        description="This expense record will be permanently deleted."
        confirmText="Remove"
        variant="destructive"
      />
    </div>
  );
}

// ── Main Finance View ──────────────────────────────────
export default function FinanceView() {
  const [period, setPeriod] = useState<"monthly" | "weekly">("monthly");

  const { data, isLoading, error } = useQuery({
    queryKey: ["finance"],
    queryFn: async () => {
      const res = await fetch("/api/finance");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    retry: 1,
    refetchInterval: 60000,
  });

  if (isLoading) return <FinanceSkeleton />;

  if (error) return (
    <div className="p-8 text-center rounded-2xl border border-red-100 bg-red-50">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <h3 className="text-base font-bold text-red-800">Error loading finance data</h3>
    </div>
  );

  const { summary, monthly, weekly, projects } = data || {};
  const chartData = period === "monthly" ? monthly : weekly;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1100px] mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Finance</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">Income, expenses, and reports.</p>
        </div>
        {projects && <AddExpenseModal projects={projects} />}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <div className="xl:col-span-2">
          <StatCard label="Total Income" value={fmt(summary?.totalEarned || 0)} sub={`${summary?.collectionRate || 0}% collected`} icon={TrendingUp} iconBg="bg-green-100" iconColor="text-green-700" trend="up" />
        </div>
        <div className="xl:col-span-2">
          <StatCard label="Net Profit" value={fmt(summary?.netProfit || 0)} sub="Income minus expenses" icon={Banknote} iconBg={summary?.netProfit >= 0 ? "bg-emerald-100" : "bg-red-100"} iconColor={summary?.netProfit >= 0 ? "text-emerald-700" : "text-red-600"} trend={summary?.netProfit >= 0 ? "up" : "down"} />
        </div>
        <div className="xl:col-span-2">
          <StatCard label="Outstanding" value={fmt(summary?.totalOutstanding || 0)} sub="Pending collections" icon={Wallet} iconBg="bg-orange-100" iconColor="text-orange-600" trend="neutral" />
        </div>
        <div className="xl:col-span-2">
          <StatCard label="Total Budget" value={fmt(summary?.totalBudget || 0)} sub="Across all projects" icon={DollarSign} iconBg="bg-purple-100" iconColor="text-purple-600" trend="neutral" />
        </div>
        <div className="xl:col-span-2">
          <StatCard label="Total Expenses" value={fmt(summary?.totalExpenses || 0)} sub="Company costs" icon={ReceiptText} iconBg="bg-red-100" iconColor="text-red-600" trend="down" />
        </div>
        <div className="xl:col-span-2">
          <StatCard label="Total Projects" value={String(projects?.length || 0)} sub="All time" icon={TrendingDown} iconBg="bg-teal-100" iconColor="text-teal-700" trend="neutral" />
        </div>
      </div>

      {/* ── Chart Section ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Income vs Expenses</h2>
            <p className="text-sm text-gray-500 mt-0.5">Comparison over time</p>
          </div>
          {/* Period toggle */}
          <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {(["monthly", "weekly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                  period === p ? "bg-white dark:bg-gray-700 shadow-sm text-green-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income"   name="Income"   fill="#22c55e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit"   name="Profit"   fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <DollarSign className="w-10 h-10 mb-3" />
            <p className="text-sm">No data yet. Add projects and record expenses.</p>
          </div>
        )}
      </div>

      {/* ── Trend Line Chart ── */}
      {chartData && chartData.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">Profit Trend</h2>
          <p className="text-sm text-gray-500 mb-5">Net profit over time</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#16a34a" strokeWidth={2.5} fill="url(#profitGrad)" dot={{ r: 4, fill: "#16a34a" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Project Breakdown ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Project Breakdown</h2>
          <span className="text-sm text-gray-400">{projects?.length || 0} projects</span>
        </div>
        {!projects || projects.length === 0 ? (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
            <DollarSign className="w-10 h-10 mx-auto mb-3" />
            <p className="text-sm">No projects yet. Create a project to track finances.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p: any) => <ProjectFinanceRow key={p._id} p={p} />)}
          </div>
        )}
      </div>

    </div>
  );
}
