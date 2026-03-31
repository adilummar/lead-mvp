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
import { Plus, DollarSign, TrendingUp, AlertCircle, FolderOpen, Clock, Pencil, Trash2, ListTodo } from "lucide-react";
import ProjectSubtasks from "./project-subtasks";

const projectSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["Planned", "In-Progress", "Testing", "Completed", "Maintenance"]),
  paymentStatus: z.enum(["Unpaid", "Partially Paid", "Fully Paid"]),
  totalBudget: z.number().min(0),
  amountPaid: z.number().min(0),
});
type ProjectFormData = z.infer<typeof projectSchema>;

const statusColors: Record<string, string> = {
  "Planned": "bg-blue-100 text-blue-700 border-blue-200",
  "In-Progress": "bg-purple-100 text-purple-700 border-purple-200",
  "Testing": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Completed": "bg-green-100 text-green-700 border-green-200",
  "Maintenance": "bg-orange-100 text-orange-700 border-orange-200",
};
const paymentColors: Record<string, string> = {
  "Unpaid": "bg-red-100 text-red-700",
  "Partially Paid": "bg-yellow-100 text-yellow-700",
  "Fully Paid": "bg-green-100 text-green-700",
};

function ProjectForm({ onSuccess, initialData, projectId }: { onSuccess: () => void; initialData?: Partial<ProjectFormData>; projectId?: string }) {
  const queryClient = useQueryClient();
  const isEdit = !!projectId;
  const { register, handleSubmit, control, formState: { errors } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { status: "Planned", paymentStatus: "Unpaid", totalBudget: 0, amountPaid: 0, ...initialData }
  });

  const mutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const url = isEdit ? `/api/projects/${projectId}` : "/api/projects";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save project");
      }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); onSuccess(); }
  });

  return (
    <>
      <DialogHeader className="mb-4">
        <DialogTitle className="text-xl sm:text-2xl font-bold">{isEdit ? "Edit Project" : "New Project"}</DialogTitle>
        <DialogDescription>{isEdit ? "Update project details." : "Track budget, status, and tasks."}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Project Title</Label>
          <Input placeholder="E.g. Website Redesign" className="rounded-xl h-11" {...register("title")} />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea placeholder="Overview..." className="rounded-xl min-h-[80px] resize-none" {...register("description")} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller name="status" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{["Planned","In-Progress","Testing","Completed","Maintenance"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>)} />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Status</Label>
            <Controller name="paymentStatus" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{["Unpaid","Partially Paid","Fully Paid"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Budget (₹)</Label><Input type="number" className="rounded-xl h-11" {...register("totalBudget", { valueAsNumber: true })} /></div>
          <div className="space-y-1.5"><Label>Paid (₹)</Label><Input type="number" className="rounded-xl h-11" {...register("amountPaid", { valueAsNumber: true })} /></div>
        </div>
        <div className="pt-2">
          <Button type="submit" disabled={mutation.isPending} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-base">
            {mutation.isPending ? "Saving..." : isEdit ? "Update Project" : "Create Project"}
          </Button>
        </div>
      </form>
    </>
  );
}

export default function ProjectList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => { const res = await fetch("/api/projects"); if (!res.ok) throw new Error("Failed"); return res.json(); },
    retry: 1
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/projects/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });

  if (isLoading) return <div className="flex flex-col items-center justify-center py-24 gap-4"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /><p className="text-gray-500 animate-pulse">Loading projects...</p></div>;
  if (error) return <div className="p-8 text-center rounded-2xl border border-red-100 bg-red-50"><AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" /><h3 className="text-base font-bold text-red-800">Connection Error</h3><p className="text-sm text-red-600">Restart npm run dev.</p></div>;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Projects</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">Track budget, status, and deliverables.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditingProject(null); }}>
          <DialogTrigger onClick={() => { setEditingProject(null); setIsFormOpen(true); }} className="shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-4 h-10 text-sm font-semibold shadow-md inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">New Project</span><span className="sm:hidden">New</span>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-5 sm:p-6">
            <ProjectForm
              onSuccess={() => { setIsFormOpen(false); setEditingProject(null); }}
              initialData={editingProject ? { title: editingProject.title, description: editingProject.description, status: editingProject.status, paymentStatus: editingProject.paymentStatus, totalBudget: editingProject.totalBudget, amountPaid: editingProject.amountPaid } : undefined}
              projectId={editingProject?._id}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <FolderOpen className="w-14 h-14 text-gray-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">No projects yet</h3>
          <p className="text-gray-500 mt-1 mb-6 text-sm">Create a project or convert a closed lead.</p>
          <Button onClick={() => setIsFormOpen(true)} variant="outline" className="rounded-xl px-8 text-sm">Create first Project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((p: any) => {
            const amountLeft = (p.totalBudget || 0) - (p.amountPaid || 0);
            const paidPct = p.totalBudget > 0 ? Math.min(100, Math.round((p.amountPaid / p.totalBudget) * 100)) : 0;
            return (
              <div key={p._id} className="group flex flex-col p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg active:scale-[0.99] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2 flex-1">{p.title}</h3>
                  <Badge variant="outline" className={`shrink-0 text-xs font-semibold rounded-full border px-2.5 ${statusColors[p.status] || ""}`}>{p.status}</Badge>
                </div>
                {p.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{p.description}</p>}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-gray-500 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />Budget</span><span className="font-semibold">₹{p.totalBudget?.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />Paid</span><span className="font-semibold text-green-600">₹{p.amountPaid?.toLocaleString("en-IN")}</span></div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5"><div className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full" style={{ width: `${paidPct}%` }} /></div>
                  <div className="flex justify-between text-xs text-gray-500"><span>Left</span><span className={amountLeft > 0 ? "text-orange-500 font-semibold" : "text-green-600 font-semibold"}>₹{amountLeft.toLocaleString("en-IN")}</span></div>
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between mt-auto">
                  <Badge className={`text-xs font-semibold rounded-full px-2.5 ${paymentColors[p.paymentStatus] || ""}`}>{p.paymentStatus}</Badge>
                  <div className="flex items-center gap-1.5">
                    {/* Tasks dialog */}
                    <Dialog>
                      <DialogTrigger className="flex items-center gap-1 text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors">
                        <ListTodo className="h-3.5 w-3.5" />
                        <span>{p.tasks?.length || 0} Tasks</span>
                      </DialogTrigger>
                      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[600px] rounded-2xl border-none shadow-2xl p-5 sm:p-6">
                        <ProjectSubtasks project={p} />
                      </DialogContent>
                    </Dialog>
                    <button onClick={() => { setEditingProject(p); setIsFormOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => { if (window.confirm(`Delete project "${p.title}"?`)) deleteMutation.mutate(p._id); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
