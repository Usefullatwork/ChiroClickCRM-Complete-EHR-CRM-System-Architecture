import { Inbox } from 'lucide-react';

/**
 * EmptyState — Reusable empty state with illustration, title, description, and CTA.
 *
 * @param {object}  props
 * @param {React.ElementType} [props.icon]   — Lucide icon (default: Inbox)
 * @param {React.ReactNode}   [props.illustration] — Custom SVG/image slot (overrides icon)
 * @param {string}  props.title              — Heading text
 * @param {string}  [props.description]      — Subtitle/explanation
 * @param {React.ReactNode} [props.action]   — CTA button or link slot
 * @param {string}  [props.className]        — Additional wrapper classes
 */
export default function EmptyState({
  icon: Icon = Inbox,
  illustration,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      {illustration || (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
