import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBootcampCoursePrice(courseName: string): number {
  if (!courseName) return 5000;
  if (courseName.includes("React / Next.js Specialist") || courseName.includes("Senior Product Designer")) return 7500;
  if (
    courseName.includes("Cloud Architect") ||
    courseName.includes("Ethical Hacker") ||
    courseName.includes("Mobile Systems Engineer") ||
    courseName.includes("IT Auditor") ||
    courseName.includes("Business Intelligence Analyst")
  ) return 8000;
  if (courseName.includes("Deep Learning & NLP Specialist")) return 10000;
  if (courseName.includes("Security Architect & Cloud Defense")) return 12000;
  if (courseName.includes("Machine Learning Engineer")) return 6000;
  return 5000; // Default base price
}

