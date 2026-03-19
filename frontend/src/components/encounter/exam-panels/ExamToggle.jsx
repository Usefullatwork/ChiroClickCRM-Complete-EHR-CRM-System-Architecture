import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Collapsible panel item wrapper for exam panels.
 */
export default function ExamToggle({
  show,
  onToggle,
  icon: Icon,
  label,
  color,
  badgeText,
  children,
}) {
  return (
    <div className={`border border-${color}-200 rounded-lg overflow-hidden`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 bg-${color}-50 hover:bg-${color}-100 transition-colors`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 text-${color}-600`} />
          <span className={`font-medium text-${color}-900`}>{label}</span>
          {badgeText && (
            <span className={`text-xs bg-${color}-200 text-${color}-800 px-2 py-0.5 rounded-full`}>
              {badgeText}
            </span>
          )}
        </div>
        {show ? (
          <ChevronUp className={`w-5 h-5 text-${color}-600`} />
        ) : (
          <ChevronDown className={`w-5 h-5 text-${color}-600`} />
        )}
      </button>
      {show && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}
