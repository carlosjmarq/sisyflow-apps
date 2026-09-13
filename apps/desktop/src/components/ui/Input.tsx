import * as React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ className = '', label, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-nintendo-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`nintendo-input ${className}`}
        {...props}
      />
    </div>
  )
}
