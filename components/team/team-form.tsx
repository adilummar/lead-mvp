"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Controller } from "react-hook-form";
import { useToast } from "@/components/providers/toast-context";
import { Camera, X } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  designation: z.string().optional(),
  bio: z.string().optional(),
  role: z.enum(["Admin", "Sales"]),
  isOwner: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface TeamFormProps {
  onSuccess: () => void;
  initialData?: any;
  memberId?: string;
}

export default function TeamForm({ onSuccess, initialData, memberId }: TeamFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!memberId;
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || initialData?.contact || "",
      designation: initialData?.designation || "",
      bio: initialData?.bio || "",
      role: initialData?.role || "Sales",
      isOwner: initialData?.isOwner || false,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      let avatarUrl = initialData?.avatarUrl || "";

      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          avatarUrl = url;
        }
      }

      const url = isEdit ? `/api/team/${memberId}` : "/api/team";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isOwner: data.role === "Admin", avatarUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success(isEdit ? "Member updated!" : "Member added!");
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save");
    },
  });

  const initials = (initialData?.name || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <DialogHeader className="mb-4">
        <DialogTitle className="text-xl sm:text-2xl font-bold">{isEdit ? "Edit Member" : "Add Team Member"}</DialogTitle>
        <DialogDescription>{isEdit ? "Update team member details." : "Add a new person to your team."}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {/* Avatar upload */}
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold border-2 border-gray-200">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Photo</p>
            <p className="text-xs text-gray-400">Click to upload</p>
            {avatarPreview && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setAvatarPreview(null); setAvatarFile(null); }} className="text-xs text-red-500 hover:underline mt-0.5 flex items-center gap-1">
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="font-semibold text-gray-700 dark:text-gray-300">Full Name</Label>
            <Input placeholder="E.g. John Doe" className="rounded-xl h-11" {...register("name")} />
            {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold text-gray-700 dark:text-gray-300">Email</Label>
            <Input placeholder="john@example.com" className="rounded-xl h-11" {...register("email")} />
            {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}
          </div>
        </div>

        {/* Phone & Designation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="font-semibold text-gray-700 dark:text-gray-300">Phone</Label>
            <Input placeholder="+91 98765 43210" className="rounded-xl h-11" {...register("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold text-gray-700 dark:text-gray-300">Designation</Label>
            <Input placeholder="E.g. Sales Executive" className="rounded-xl h-11" {...register("designation")} />
          </div>
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <Label className="font-semibold text-gray-700 dark:text-gray-300">Role</Label>
          <Controller name="role" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin (Owner)</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Label className="font-semibold text-gray-700 dark:text-gray-300">Bio (Optional)</Label>
          <Textarea placeholder="Short description about this person..." className="rounded-xl min-h-[80px] resize-none" {...register("bio")} />
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={mutation.isPending} className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-base shadow-md">
            {mutation.isPending ? "Saving..." : isEdit ? "Update Member" : "Add Member"}
          </Button>
        </div>
      </form>
    </>
  );
}
