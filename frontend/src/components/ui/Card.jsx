import _React from 'react';

export const Card = ({ children, className = '', hover = false }) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 shadow-sm ${hover ? 'hover:shadow-md transition-shadow' : ''} ${className}`}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 border-b border-slate-200 ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`p-6 border-t border-slate-200 bg-slate-50 ${className}`}>{children}</div>
);

export default Card;
