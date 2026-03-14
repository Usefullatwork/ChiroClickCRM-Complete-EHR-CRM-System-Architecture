export const Card = ({ children, className = '', hover = false }) => (
  <div
    className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-soft-sm ${hover ? 'hover:shadow-soft transition-shadow' : ''} ${className}`}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 border-b border-slate-200 dark:border-slate-700 ${className}`}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div
    className={`p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 ${className}`}
  >
    {children}
  </div>
);

export default Card;
