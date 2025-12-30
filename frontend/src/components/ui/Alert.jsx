import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export const Alert = ({
  children,
  variant = 'info',
  title,
  onClose,
  className = ''
}) => {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: <Info size={20} className="text-blue-600" />
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 size={20} className="text-emerald-600" />
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle size={20} className="text-amber-600" />
    },
    danger: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <XCircle size={20} className="text-rose-600" />
    }
  };

  const config = variants[variant];

  return (
    <div className={`border rounded-lg p-4 ${config.container} ${className}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
