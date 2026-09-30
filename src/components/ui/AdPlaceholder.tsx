import React from "react";
import { cn } from "../../lib/utils";

interface AdPlaceholderProps {
  className?: string;
  type?: "banner" | "rectangle" | "sidebar";
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ className, type = "banner" }) => {
  const baseClasses = "flex items-center justify-center bg-slate-100 text-slate-400 text-sm font-medium border border-slate-200 border-dashed rounded-lg";
  
  const typeClasses = {
    banner: "w-full h-24 max-w-[728px] mx-auto",
    rectangle: "w-[300px] h-[250px] mx-auto",
    sidebar: "w-full h-[600px] max-w-[300px] mx-auto",
  };

  return (
    <div className={cn(baseClasses, typeClasses[type], className)}>
      Advertisement
    </div>
  );
};
