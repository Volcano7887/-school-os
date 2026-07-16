"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { UserPlus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { addMember, updateMemberRole, removeMember } from "@/features/members/actions";
import { initialActionState } from "@/lib/types/action-state";
import type { SchoolMember } from "@/lib/school/queries";
import type { SchoolRole } from "@/types/database.types";

const ROLE_LABEL: Record<SchoolRole, string> = {
  super_admin: "Super Admin",
  school_admin: "Admin",
  principal: "Principal",
  accountant: "Accountant",
  teacher: "Teacher",
  parent: "Parent",
  student: "Student",
};

const ASSIGNABLE_ROLES: SchoolRole[] = ["school_admin", "principal", "accountant"];

function AddMemberDialog({ schoolSlug }: { schoolSlug: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(initialActionState);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addMember(schoolSlug, initialActionState, formData);
      setState(result);
      if (result.status === "success" && !result.data?.tempPassword) {
        toast.success(result.message ?? "Member added.");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setState(initialActionState);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        {state.status === "success" && state.data?.tempPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Account created</DialogTitle>
              <DialogDescription>
                Share this temporary password with {state.data.email} — it won&apos;t be shown
                again. They can change it after signing in.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 px-3 py-2 font-mono text-sm">
              {state.data.tempPassword}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  navigator.clipboard.writeText(state.data!.tempPassword);
                  toast.success("Copied to clipboard");
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add a member</DialogTitle>
              <DialogDescription>
                If this email already has an account, they&apos;ll just be added to this school
                with the role you pick. Otherwise a new account is created.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="grid gap-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required />
                {state.fieldErrors?.fullName && (
                  <p className="text-sm text-destructive">{state.fieldErrors.fullName[0]}</p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
                {state.fieldErrors?.email && (
                  <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="accountant">
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {state.status === "error" && state.message && (
                <p className="text-sm text-destructive">{state.message}</p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Adding…" : "Add Member"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MemberRoleSelect({
  schoolSlug,
  userId,
  role,
}: {
  schoolSlug: string;
  userId: string;
  role: SchoolRole;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={role}
      disabled={isPending}
      onValueChange={(next) => {
        startTransition(async () => {
          const result = await updateMemberRole(schoolSlug, userId, next as SchoolRole);
          if (result.status === "success") {
            toast.success("Role updated.");
          } else {
            toast.error(result.message ?? "Couldn't update the role.");
          }
        });
      }}
    >
      <SelectTrigger size="sm" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ASSIGNABLE_ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABEL[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RemoveMemberButton({ schoolSlug, userId }: { schoolSlug: string; userId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Remove this member from the school?")) return;
    startTransition(async () => {
      const result = await removeMember(schoolSlug, userId);
      if (result.status === "success") {
        toast.success("Member removed.");
      } else {
        toast.error(result.message ?? "Couldn't remove this member.");
      }
    });
  }

  return (
    <Button size="sm" variant="ghost" onClick={handleClick} disabled={isPending}>
      Remove
    </Button>
  );
}

export function MembersSection({
  schoolSlug,
  members,
  currentUserId,
}: {
  schoolSlug: string;
  members: SchoolMember[];
  currentUserId: string;
}) {
  return (
    <Card className="max-w-2xl">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Add staff and assign what they can do — Admin has full access, Principal can receive
            cash handovers, Accountant records day-to-day payments.
          </CardDescription>
        </div>
        <AddMemberDialog schoolSlug={schoolSlug} />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const isSelf = m.userId === currentUserId;
                return (
                  <TableRow key={m.userId}>
                    <TableCell className="font-medium">
                      {m.fullName ?? "—"}
                      {isSelf && (
                        <Badge variant="secondary" className="ml-2">
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell>
                      {isSelf ? (
                        <Badge>{ROLE_LABEL[m.role]}</Badge>
                      ) : (
                        <MemberRoleSelect schoolSlug={schoolSlug} userId={m.userId} role={m.role} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isSelf && <RemoveMemberButton schoolSlug={schoolSlug} userId={m.userId} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
