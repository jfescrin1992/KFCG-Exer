import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateBMI = (heightCm: string | undefined, weightKg: string | undefined) => {
  if (!heightCm || !weightKg) return '--';
  const h = parseFloat(heightCm) / 100;
  const w = parseFloat(weightKg);
  if (h > 0 && w > 0) {
    return (w / (h * h)).toFixed(1);
  }
  return '--';
};

export const getBMICategory = (bmi: string) => {
  const val = parseFloat(bmi);
  if (isNaN(val)) return { label: 'N/A', color: 'text-neutral-400' };
  if (val < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
  if (val < 25) return { label: 'Normal', color: 'text-green-600' };
  if (val < 30) return { label: 'Overweight', color: 'text-orange-500' };
  return { label: 'Obese', color: 'text-red-600' };
};
