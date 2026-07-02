import { cn } from '../../lib/utils';
import type { HallucinationItem } from '../../types';
import { AlertTriangle, HelpCircle, XCircle } from 'lucide-react';

const typeConfig = {
  unsupported_fact: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Unsupported Fact' },
  conflicting_info: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Conflicting Info' },
  low_confidence: { icon: HelpCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Low Confidence' },
  possible_hallucination: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Possible Hallucination' },
};

function HallucinationCard({ item }: { item: HallucinationItem }) {
  const config = typeConfig[item.type as keyof typeof typeConfig] || typeConfig.low_confidence;
  const Icon = config.icon;

  return (
    <div className={cn('rounded-lg p-3 border border-gray-100 dark:border-gray-800', config.bg)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.color)} />
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
            <span className="text-xs text-gray-400 capitalize">{item.confidence} confidence</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{item.text}</p>
          {item.explanation && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.explanation}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface HallucinationPanelProps {
  analysis: {
    unsupported_facts: HallucinationItem[];
    conflicting_info: HallucinationItem[];
    low_confidence: HallucinationItem[];
    possible_hallucinations: HallucinationItem[];
  };
}

export function HallucinationPanel({ analysis }: HallucinationPanelProps) {
  const allItems = [
    ...analysis.unsupported_facts,
    ...analysis.conflicting_info,
    ...analysis.low_confidence,
    ...analysis.possible_hallucinations,
  ];

  if (allItems.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        No hallucination risks detected
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {allItems.map((item, i) => (
        <HallucinationCard key={i} item={item} />
      ))}
    </div>
  );
}
