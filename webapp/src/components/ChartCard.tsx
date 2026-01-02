import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
  headerColor?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  subtitle, 
  className = "",
  headerColor = "text-telegram-hint"
}) => {
  return (
    <div className={`bg-telegram-bg p-6 rounded-[2rem] shadow-sm ${className}`}>
      <h3 className={`text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${headerColor}`}>
        {Icon && <Icon size={14}/>} {title}
      </h3>
      {children}
      {subtitle && <p className="text-[10px] text-telegram-hint mt-4 text-center font-medium">{subtitle}</p>}
    </div>
  );
};
