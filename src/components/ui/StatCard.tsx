import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'amber' | 'red' | 'teal' | 'slate';
  trend?: { value: number; label: string };
}

const colors = {
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-600', text: 'text-blue-600' },
  green: { bg: 'bg-green-50', icon: 'bg-green-600', text: 'text-green-600' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-600' },
  red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-600' },
  teal: { bg: 'bg-teal-50', icon: 'bg-teal-600', text: 'text-teal-600' },
  slate: { bg: 'bg-slate-50', icon: 'bg-slate-600', text: 'text-slate-600' },
};

export function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const c = colors[color];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              <span>{trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}%</span>
              <span className="text-gray-400 font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`${c.bg} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${c.text}`} />
        </div>
      </div>
    </div>
  );
}
