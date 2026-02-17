import _React from 'react';

export const Label = ({ children, htmlFor, className = '', required = false }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    >
      {children}
      {required && <span className="text-rose-500 ml-1">*</span>}
    </label>
  );
};

export default Label;
