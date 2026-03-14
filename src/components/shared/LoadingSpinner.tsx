import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function LoadingSpinner({ size = "md", label }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`animate-spin text-accent ${sizeClasses[size]}`} />
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </div>
  );
}
