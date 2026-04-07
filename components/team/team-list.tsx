"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Users, Phone, Mail, TrendingUp, Pencil, Trash2, Crown, ChevronDown, ChevronUp } from "lucide-react";
import TeamForm from "./team-form";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/providers/toast-context";

// Avatar with gradient initials fallback
function Avatar({ name, avatarUrl, size = "lg" }: { name: string; avatarUrl?: string; size?: "sm" | "lg" }) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const sizeClass = size === "lg" ? "w-16 h-16 text-xl" : "w-10 h-10 text-sm";

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${sizeClass} rounded-2xl object-cover border-2 border-white shadow-md`} />;
  }
  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md border-2 border-white`}>
      {initials}
    </div>
  );
}

// Stat pill
function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${color}`}>
      <span>{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

// Team member card
function MemberCard({ member, onEdit, onDelete }: { member: any; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const stats = member.stats || {};

  return (
    <div className="group flex flex-col p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar name={member.name} avatarUrl={member.avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{member.name}</h3>
            {member.isOwner && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                <Crown className="w-3 h-3" /> Owner
              </span>
            )}
          </div>
          {member.designation && (
            <p className="text-sm text-gray-500 truncate">{member.designation}</p>
          )}
          <Badge variant="outline" className={`mt-1.5 text-[10px] font-semibold rounded-full border px-2 ${
            member.role === "Admin" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-green-100 text-green-700 border-green-200"
          }`}>
            {member.role}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors"><Pencil className="w-4 h-4" /></button>
          {!member.isOwner && (
            <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 mb-4">
        {(member.phone || member.contact) && (
          <div className="flex items-center text-sm text-gray-500 gap-2">
            <Phone className="w-3.5 h-3.5 text-green-600 shrink-0" />
            <span className="truncate">{member.phone || member.contact}</span>
          </div>
        )}
        {member.email && (
          <div className="flex items-center text-sm text-gray-500 gap-2">
            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
        )}
      </div>

      {/* Quick stat pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        <StatPill label="Leads" value={stats.totalLeads || 0} color="bg-blue-50 text-blue-700" />
        <StatPill label="Closed" value={stats.closedLeads || 0} color="bg-green-50 text-green-700" />
        <StatPill label="Conv." value={`${stats.conversionRate || 0}%`} color="bg-purple-50 text-purple-700" />
      </div>

      {/* Expand for more */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-green-700 py-1.5 border-t border-gray-100 dark:border-gray-800 transition-colors"
      >
        {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Less</> : <><ChevronDown className="w-3.5 h-3.5" /> More Details</>}
      </button>

      {expanded && (
        <div className="pt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {member.bio && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bio</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{member.bio}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
              <p className="text-lg font-extrabold text-green-700">{stats.closedLeads || 0}</p>
              <p className="text-[10px] font-semibold text-green-600 uppercase">Closed</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
              <p className="text-lg font-extrabold text-red-600">{stats.lostLeads || 0}</p>
              <p className="text-[10px] font-semibold text-red-500 uppercase">Lost</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-center">
              <p className="text-lg font-extrabold text-purple-700">{stats.conversionRate || 0}%</p>
              <p className="text-[10px] font-semibold text-purple-600 uppercase">Rate</p>
            </div>
          </div>
          {member.joinedAt && (
            <p className="text-xs text-gray-400 text-center">
              Joined {new Date(member.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeamList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: members, isLoading, error } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Team member removed");
    },
  });

  if (isLoading) return <CardListSkeleton />;
  if (error) return (
    <div className="p-8 text-center rounded-2xl border border-red-100 bg-red-50">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <h3 className="text-base font-bold text-red-800">Failed to load team</h3>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Team</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">Manage your sales team and track performance.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditingMember(null); }}>
          <DialogTrigger
            onClick={() => { setEditingMember(null); setIsFormOpen(true); }}
            className="shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl px-4 h-10 text-sm font-semibold shadow-md inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Member</span><span className="sm:hidden">Add</span>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-5 sm:p-6">
            <TeamForm
              onSuccess={() => { setIsFormOpen(false); setEditingMember(null); }}
              initialData={editingMember || undefined}
              memberId={editingMember?._id}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary bar */}
      {members && members.length > 0 && (
        <div className="flex gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-800 dark:text-green-300">{members.length} Members</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{members.filter((m: any) => m.isOwner).length} Owners</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {members.reduce((sum: number, m: any) => sum + (m.stats?.totalLeads || 0), 0)} Total Leads
            </span>
          </div>
        </div>
      )}

      {/* Grid */}
      {!members || members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <Users className="w-14 h-14 text-gray-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">No team members</h3>
          <p className="text-gray-500 mt-1 mb-6 text-sm">Add your team to start tracking.</p>
          <Button onClick={() => setIsFormOpen(true)} variant="outline" className="rounded-xl px-8 text-sm">Add First Member</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {members.map((member: any) => (
            <MemberCard
              key={member._id}
              member={member}
              onEdit={() => { setEditingMember(member); setIsFormOpen(true); }}
              onDelete={() => setConfirmDelete(member)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { deleteMutation.mutate(confirmDelete._id); setConfirmDelete(null); }}
        title={`Remove "${confirmDelete?.name}"?`}
        description="This team member will be permanently removed. Their assigned leads will remain."
        confirmText="Remove"
        variant="destructive"
      />
    </div>
  );
}
