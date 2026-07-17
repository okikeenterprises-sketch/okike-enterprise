import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBootcampCoursePrice(courseName: string): number {
  if (!courseName) return 5000;
  if (courseName.includes("React / Next.js Specialist") || courseName.includes("Senior Product Designer")) return 7500;
  if (courseName.includes("Cloud Engineer") || courseName.includes("Ethical Hacker") || courseName.includes("Mobile Systems Engineer")) return 8000;
  if (courseName.includes("DevSecOps & Security Architect")) return 12000;
  return 5000; // Default base price
}

