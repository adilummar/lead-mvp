"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, Briefcase, TrendingUp, DollarSign, Target, CheckCircle2, AlertCircle } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">{label}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${color}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    retry: 1,
    refetchInterval: 60000,
  });

  const { data: todos } = useQuery({
    queryKey: ["master-todos"],
    queryFn: async () => {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    retry: 1,
  });

  const todayTodos = (todos || []).filter((t: any) => t.assignedToDay === "Today" && !t.isCompleted);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 animate-pulse">Loading dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center rounded-2xl border border-red-100 bg-red-50 dark:bg-red-900/20">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <h3 className="text-base font-bold text-red-800">Connection Error</h3>
      <p className="text-sm text-red-600">Restart <code>npm run dev</code> to start in-memory DB.</p>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm sm:text-base">Your business at a glance.</p>
      </div>

      {/* Stats — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        <StatCard icon={Users}     label="Total Leads"        value={stats?.totalLeads ?? 0}           sub={`${stats?.closedLeads ?? 0} closed`}         color="bg-blue-500" />
        <StatCard icon={TrendingUp} label="Conversion"        value={`${stats?.conversionRate ?? 0}%`} sub="Leads → Closed"                               color="bg-indigo-500" />
        <StatCard icon={Briefcase} label="Projects"           value={stats?.totalProjects ?? 0}        sub={`${stats?.completedProjects ?? 0} completed`}  color="bg-purple-500" />
        <StatCard icon={DollarSign} label="Revenue"           value={`₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`} sub={`₹${(stats?.totalOutstanding ?? 0).toLocaleString("en-IN")} pending`} color="bg-green-500" />
      </div>

      {/* Chart + Today's Todos — stack on mobile */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Bar Chart */}
        <div className="xl:col-span-2 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6">Lead Inflow (Last 6 Months)</h2>
          {stats?.chartData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.chartData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", fontSize: 13 }}
                  cursor={{ fill: "#f3f4f6", radius: 8 }}
                />
                <Bar dataKey="leads" fill="url(#blueGrad)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400">
              <p className="text-sm text-center">No lead data yet. Add leads to see chart.</p>
            </div>
          )}
        </div>

        {/* Today's Todos */}
        <div className="p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
            Today's Tasks
            <span className="ml-auto text-sm text-gray-400 font-normal">{todayTodos.length} pending</span>
          </h2>
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {todayTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-9 h-9 text-green-400 mb-2" />
                <p className="text-sm font-semibold text-gray-700">All clear!</p>
                <p className="text-xs text-gray-400 mt-1">Nothing due today.</p>
              </div>
            ) : (
              todayTodos.map((todo: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${todo.priority === "High" ? "bg-red-500" : todo.priority === "Medium" ? "bg-yellow-500" : "bg-green-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{todo.taskName}</p>
                    <p className="text-xs text-gray-400 truncate">{todo.source}: {todo.sourceName}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Goals summary */}
      <div className="p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500 shrink-0" />
          Company Goals
          <span className="ml-auto text-sm text-gray-400 font-normal">{stats?.goals ?? 0} active</span>
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {(stats?.goals ?? 0) === 0
            ? <><a href="/goals" className="text-blue-600 hover:underline">Add your first goal →</a></>
            : <>{stats.goals} goal{stats.goals !== 1 ? "s" : ""} active. <a href="/goals" className="text-blue-600 hover:underline">View all →</a></>
          }
        </p>
      </div>
    </div>
  );
}
