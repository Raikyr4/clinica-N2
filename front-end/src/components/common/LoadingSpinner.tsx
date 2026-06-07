import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = "md", className = "", label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]} ${className}`} />
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
    </div>
  );
}
