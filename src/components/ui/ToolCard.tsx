import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  gradientClass: string;
  className?: string;
  tag?: string;
}

export const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon: Icon, path, gradientClass, className, tag = "Tool" }) => {
  return (
    <Link
      to={path}
      className={cn(
        "group relative flex flex-col justify-between p-8 rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl h-[280px] sm:h-[320px]",
        gradientClass,
        className
      )}
    >
      <div className="flex justify-between items-start text-black">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-sm">
          <Icon className="w-6 h-6 text-black/90" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-black/60 pt-2 pr-1">{tag}</span>
      </div>
      
      <div className="text-black">
        <p className="text-sm font-semibold mb-2 opacity-80 uppercase tracking-wide">{description}</p>
        <h3 className="text-3xl font-bold tracking-tight leading-tight w-[95%]">{title}</h3>
      </div>
    </Link>
  );
};
