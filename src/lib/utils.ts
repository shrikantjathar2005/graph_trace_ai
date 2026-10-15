import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncate(str: string, length = 32): string {
  if (!str) return "";
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}
