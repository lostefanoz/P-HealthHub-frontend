import { ReactNode } from 'react'

type FormSelectProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
  'aria-label'?: string
  children: ReactNode
}

export default function FormSelect({ value, onChange, disabled, required, className, id, children, ...aria }: FormSelectProps) {
  return (
    <select
      id={id}
      className={['ds-input', 'ds-select', className].filter(Boolean).join(' ')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      {...aria}
    >
      {children}
    </select>
  )
}
