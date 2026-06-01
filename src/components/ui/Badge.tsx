interface BadgeProps {
  label: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'teal';
}

const colors = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
  teal: 'bg-teal-100 text-teal-700',
};

export function Badge({ label, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {label}
    </span>
  );
}
