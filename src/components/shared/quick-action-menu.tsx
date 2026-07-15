"use client";

import Link from "next/link";
import { Plus, ChevronDown, Wallet, Receipt, Banknote, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickActionMenu({ schoolSlug }: { schoolSlug: string }) {
  const items = [
    { label: "Collect Fee", href: `/${schoolSlug}/fees`, icon: Wallet },
    { label: "Add Expense", href: `/${schoolSlug}/expenses`, icon: Receipt },
    { label: "Salary Payment", href: `/${schoolSlug}/salary`, icon: Banknote },
    { label: "Add Student", href: `/${schoolSlug}/students`, icon: UserPlus },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="size-4" />
          Quick Action
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>
              <item.icon className="size-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
