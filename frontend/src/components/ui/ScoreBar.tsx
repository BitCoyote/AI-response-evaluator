import { cn, getScoreColor } from '../../lib/utils';

interface ScoreBarProps {
  label: string;
  value: number;
  invert?: boolean;
  color?: string;
}

export function ScoreBar({ label, value, invert, color }: ScoreBarProps) {
  const barColor = color || getScoreColor(value, invert);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
