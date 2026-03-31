"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, FolderOpen, Clock, Pencil, Trash2, ListTodo, Phone, ArrowRight } from "lucide-react";
import LeadForm from "./lead-form";
import LeadSubtasks from "./lead-subtasks";


const getStatusColor = (s: string) => {
  switch (s) {
    case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Contacted': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Proposal': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Negotiation': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Closed': return 'bg-green-100 text-green-700 border-green-200';
    case 'Lost': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export default function LeadList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    retry: 1
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  });

  const convertMutation = useMutation({
    mutationFn: async (lead: any) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead._id, title: lead.name + " — Project", salesmanId: "000000000000000000000001", status: "Planned", paymentStatus: "Unpaid", totalBudget: 0, amountPaid: 0 }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); alert("✅ Lead converted to project!"); }
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 animate-pulse">Loading leads...</p>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center rounded-2xl border border-red-100 bg-red-50 mt-8">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <h3 className="text-base font-bold text-red-800">Connection Error</h3>
      <p className="text-sm text-red-600">Restart <code>npm run dev</code> to start in-memory DB.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Active Leads</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">Manage prospects and convert them to projects.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditingLead(null); }}>
          <DialogTrigger onClick={() => { setEditingLead(null); setIsFormOpen(true); }} className="shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 h-10 text-sm font-semibold shadow-md inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Lead</span><span className="sm:hidden">Add</span>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[480px] rounded-2xl p-5 sm:p-6 border-none shadow-2xl">
            <LeadForm
              onSuccess={() => { setIsFormOpen(false); setEditingLead(null); }}
              initialData={editingLead ? { name: editingLead.name, contactNumber: editingLead.contactNumber, status: editingLead.status, remarks: editingLead.remarks } : undefined}
              leadId={editingLead?._id}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!leads || leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-gray-50/50">
          <FolderOpen className="w-14 h-14 text-gray-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">No leads found</h3>
          <p className="text-gray-500 mt-1 mb-6 text-sm text-center px-6">Your pipeline is empty.</p>
          <Button onClick={() => setIsFormOpen(true)} variant="outline" className="rounded-xl px-8 text-sm">Add First Lead</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {leads.map((lead: any) => (
            <div key={lead._id} className="group flex flex-col justify-between p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg active:scale-[0.99] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight flex-1 min-w-0 line-clamp-2">{lead.name}</h3>
                  <Badge variant="outline" className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(lead.status)}`}>{lead.status}</Badge>
                </div>
                <div className="flex items-center text-gray-500 text-sm mb-3">
                  <Phone className="w-4 h-4 mr-2 text-blue-500 shrink-0" />
                  <span className="truncate">{lead.contactNumber}</span>
                </div>
                {lead.remarks && (
                  <div className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 line-clamp-2 italic mb-3">"{lead.remarks}"</div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                {/* Action row */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 rounded-lg gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {lead.todos?.length || 0} Tasks
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Edit */}
                    <button
                      onClick={() => { setEditingLead(lead); setIsFormOpen(true); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit lead"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => { if (window.confirm(`Delete lead "${lead.name}"?`)) deleteMutation.mutate(lead._id); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {/* Tasks */}
                    <Dialog>
                      <DialogTrigger className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
                        <ListTodo className="h-3.5 w-3.5" /> Tasks
                      </DialogTrigger>
                      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[600px] rounded-2xl border-none shadow-2xl p-5 sm:p-6">
                        <LeadSubtasks lead={lead} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {lead.status === 'Closed' && (
                  <button
                    onClick={() => convertMutation.mutate(lead)}
                    disabled={convertMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 active:scale-[0.98] text-white transition-all shadow-sm"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {convertMutation.isPending ? "Converting..." : "Convert to Project"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
