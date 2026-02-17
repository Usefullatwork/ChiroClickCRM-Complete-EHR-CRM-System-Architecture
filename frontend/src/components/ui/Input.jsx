export const Input = ({ label, error, helperText, required = false, className = '', ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <input
      className={`block w-full rounded-md border-slate-300 border shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2 px-3 disabled:bg-slate-50 disabled:text-slate-500 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-sm text-red-600">{error}</p>}
    {helperText && !error && <p className="text-sm text-slate-500">{helperText}</p>}
  </div>
);

export const TextArea = ({
  label,
  error,
  helperText,
  required = false,
  rows = 4,
  className = '',
  ...props
}) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <textarea
      rows={rows}
      className={`block w-full rounded-md border-slate-300 border shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2 px-3 disabled:bg-slate-50 disabled:text-slate-500 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-sm text-red-600">{error}</p>}
    {helperText && !error && <p className="text-sm text-slate-500">{helperText}</p>}
  </div>
);

export default Input;
