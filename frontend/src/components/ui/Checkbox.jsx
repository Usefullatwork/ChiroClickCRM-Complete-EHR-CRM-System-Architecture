import React from 'react';
import { Check } from 'lucide-react';

export const Checkbox = ({
  id,
  checked,
  onChange,
  className = '',
  disabled = false
}) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      className={`
        h-4 w-4 shrink-0 rounded border border-slate-300
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white'}
        ${className}
      `}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
};

export default Checkbox;
