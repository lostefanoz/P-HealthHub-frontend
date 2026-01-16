import React from 'react'

type Props = {
  tone: 'loading' | 'error' | 'empty'
  message: string
}

export function StateBlock({ tone, message }: Props) {
  const cls =
    tone === 'error' ? 'alert alert-danger' :
    tone === 'empty' ? 'ds-card ds-card-body' :
    'ds-card ds-card-body'
  return (
    <div className={cls}>
      {message}
    </div>
  )
}
