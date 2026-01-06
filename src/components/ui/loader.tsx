
import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "default" | "primary" | "secondary" | "white";
}

const Loader = ({ 
  size = "md", 
  color = "default", 
  className, 
  ...props 
}: LoaderProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const colorClasses = {
    default: "text-gray-600",
    primary: "text-green-600",
    secondary: "text-blue-600",
    white: "text-white",
  };

  return (
    <div 
      className={cn("flex items-center justify-center", className)} 
      {...props}
    >
      <Loader2 
        className={cn(
          "animate-spin", 
          sizeClasses[size], 
          colorClasses[color]
        )}
      />
    </div>
  );
};

// Export both the Loader component and Loader2 from lucide
export { Loader, Loader2 };
