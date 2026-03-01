import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getDayName(dayOfWeek: number, short = false): string {
  return short ? dayNamesShort[dayOfWeek] : dayNames[dayOfWeek];
}

export function getGradeLetter(percentage: number): string {
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  if (percentage >= 60) return "D-";
  return "F";
}

export function getGradeColor(percentage: number): string {
  if (percentage >= 90) return "text-green-600";
  if (percentage >= 80) return "text-blue-600";
  if (percentage >= 70) return "text-yellow-600";
  return "text-red-600";
}

export function getGradeBgColor(percentage: number): string {
  if (percentage >= 90) return "#dcfce7";
  if (percentage >= 80) return "#dbeafe";
  if (percentage >= 70) return "#fef9c3";
  return "#fecaca";
}
