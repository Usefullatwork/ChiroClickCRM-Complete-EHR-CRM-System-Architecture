import { Loader2 } from 'lucide-react';

/**
 * LoadingButton — Button with loading/spinner state.
 *
 * When `loading` is true the button shows a spinner, disables interaction,
 * and optionally replaces its label with `loadingText`.
 *
 * @param {object}  props
 * @param {boolean} [props.loading]      — Show spinner & disable
 * @param {string}  [props.loadingText]  — Text shown while loading
 * @param {string}  [props.variant]      — 'primary' | 'secondary' | 'destructive' | 'ghost'
 * @param {string}  [props.size]         — 'sm' | 'md' | 'lg'
 * @param {React.ElementType} [props.icon] — Left icon component
 * @param {React.ReactNode}   props.children
 */
export default function LoadingButton({
  loading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  disabled,
  ...rest
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

  const variantClasses = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600',
    secondary:
      'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
    ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          {loadingText || children}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
          {children}
        </>
      )}
    </button>
  );
}
