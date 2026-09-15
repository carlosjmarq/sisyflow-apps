import * as React from 'react'

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  supportingText?: string
  error?: boolean
  containerClassName?: string
  labelBgClass?: string
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    className = '',
    containerClassName = '',
    labelBgClass = 'bg-surface',
    label,
    supportingText,
    error = false,
    id,
    ...props
  },
  ref,
) {
  const inputId = id || (label ? `field-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div className={`flex w-full flex-col gap-1 ${containerClassName}`}>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          placeholder={label ? ' ' : props.placeholder}
          className={[
            'peer h-14 w-full rounded-xs border bg-transparent px-4 text-body-large text-on-surface outline-none',
            'transition-[border-color,box-shadow] duration-150 placeholder:text-on-surface/38',
            error
              ? 'border-error focus:border-error focus:shadow-[inset_0_0_0_1px_rgb(var(--md-error))]'
              : 'border-outline focus:border-primary focus:shadow-[inset_0_0_0_1px_rgb(var(--md-primary))]',
            'disabled:border-on-surface/12 disabled:text-on-surface/38',
            className,
          ].join(' ')}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className={[
              'pointer-events-none absolute left-3 top-0 -translate-y-1/2 px-1 text-label-medium transition-all duration-150',
              labelBgClass,
              error ? 'text-error' : 'text-on-surface-variant peer-focus:text-primary',
              'peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-body-large peer-focus:top-0 peer-focus:text-label-medium',
            ].join(' ')}
          >
            {label}
          </label>
        )}
      </div>
      {supportingText && (
        <span
          className={`px-4 text-body-small ${error ? 'text-error' : 'text-on-surface-variant'}`}
        >
          {supportingText}
        </span>
      )}
    </div>
  )
})
