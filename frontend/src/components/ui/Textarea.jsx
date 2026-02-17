export const Textarea = ({
  className = '',
  placeholder,
  value,
  onChange,
  rows = 4,
  disabled = false,
  ...props
}) => {
  return (
    <textarea
      className={`
        flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2
        text-sm placeholder:text-slate-400
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      disabled={disabled}
      {...props}
    />
  );
};

export default Textarea;
