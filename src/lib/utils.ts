import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Paise -> "₹1,234" or "-₹1,234" for negative amounts (never "₹-1,234").
export function inr(paise: number) {
  const sign = paise < 0 ? "-" : "";
  return `${sign}₹${Math.abs(paise / 100).toLocaleString("en-IN")}`;
}
