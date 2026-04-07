"use client";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/providers/toast-context";

const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  contactNumber: z.string().min(5, "Contact Number is required."),
  status: z.enum(['New', 'Contacted', 'Proposal', 'Negotiation', 'Closed', 'Lost']),
  leadSource: z.enum(['Company', 'Salesperson']),
  salesmanId: z.string().min(1, "Please select an assigned person"),
  remarks: z.string().optional()
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  onSuccess: () => void;
  initialData?: Partial<LeadFormData>;
  leadId?: string;
}

export default function LeadForm({ onSuccess, initialData, leadId }: LeadFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!leadId;

  // Fetch team members for assignment dropdown
  const { data: team } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      status: 'New',
      leadSource: 'Company',
      salesmanId: '',
      remarks: '',
      ...initialData,
    }
  });

  const leadSource = watch("leadSource");

  const mutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const url = isEdit ? `/api/leads/${leadId}` : '/api/leads';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to save lead');
      return { json: await res.json(), data };
    },
    onSuccess: ({ data }) => {
      if (data.status === 'Closed') {
        sessionStorage.setItem('celebrate_closed', data.name || 'A lead');
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(isEdit ? "Lead updated!" : "Lead created!");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to save lead");
    }
  });

  return (
    <>
      <DialogHeader className="mb-4">
        <DialogTitle className="text-xl sm:text-2xl font-bold">{isEdit ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        <DialogDescription>{isEdit ? 'Update the lead details below.' : 'Enter prospect details below.'}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="font-semibold text-gray-700 dark:text-gray-300">Full Name</Label>
          <Input placeholder="E.g. John Doe" className="rounded-xl h-11" {...register("name")} />
          {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="font-semibold text-gray-700 dark:text-gray-300">Contact Number</Label>
            <Input placeholder="+91 98765 43210" className="rounded-xl h-11" {...register("contactNumber")} />
            {errors.contactNumber && <span className="text-sm text-red-500">{errors.contactNumber.message}</span>}
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold text-gray-700 dark:text-gray-300">Status</Label>
            <Controller name="status" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  {['New','Contacted','Proposal','Negotiation','Closed','Lost'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>

        {/* Lead Source + Assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="font-semibold text-gray-700 dark:text-gray-300">Lead Source</Label>
            <Controller name="leadSource" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company">🏢 Company</SelectItem>
                  <SelectItem value="Salesperson">👤 Salesperson</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold text-gray-700 dark:text-gray-300">
              {leadSource === "Salesperson" ? "Brought By" : "Assigned To"}
            </Label>
            <Controller name="salesmanId" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select person..." /></SelectTrigger>
                <SelectContent>
                  {(team || []).map((member: any) => (
                    <SelectItem key={member._id} value={member._id}>
                      {member.name} {member.isOwner ? "👑" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {errors.salesmanId && <span className="text-sm text-red-500">{errors.salesmanId.message}</span>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="font-semibold text-gray-700 dark:text-gray-300">Remarks (Optional)</Label>
          <Textarea placeholder="Initial context about the client..." className="rounded-xl min-h-[90px] resize-none" {...register("remarks")} />
        </div>
        <div className="pt-2">
          <Button type="submit" disabled={mutation.isPending} className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-base shadow-md">
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Lead' : 'Save Lead'}
          </Button>
        </div>
      </form>
    </>
  );
}
