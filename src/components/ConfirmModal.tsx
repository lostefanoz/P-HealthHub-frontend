import { ReactNode, useEffect, useId, useLayoutEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

type ConfirmModalProps = {
  title: string
  message: string
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
  footer?: ReactNode
}

function getFocusable(container: HTMLElement) {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ]
  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(','))).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  )
}

export default function ConfirmModal({
  title,
  message,
  children,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  variant = 'default',
  confirmDisabled = false,
  onConfirm,
  onCancel,
  footer,
}: ConfirmModalProps) {
  const titleId = useId()
  const descId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const lastActive = useRef<HTMLElement | null>(null)

  useEffect(() => {
    try {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    } catch {
      // ignore
    }
  }, [])

  useLayoutEffect(() => {
    try {
      lastActive.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      const el = dialogRef.current
      if (!el) return
      const focusable = getFocusable(el)
      ;(focusable[0] ?? el).focus()
      return () => lastActive.current?.focus?.()
    } catch {
      // ignore
    }
  }, [])

  const onKeyDown = useMemo(
    () => (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
        return
      }
      if (e.key !== 'Tab') return

      const el = dialogRef.current
      if (!el) return
      const focusable = getFocusable(el)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || active === el) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onCancel]
  )

  const defaultFooter = (
    <>
      <button className="ds-btn ds-btn-ghost" type="button" onClick={onCancel}>
        {cancelLabel}
      </button>
      <button
        className={variant === 'danger' ? 'ds-btn ds-btn-danger' : 'ds-btn ds-btn-primary'}
        type="button"
        onClick={onConfirm}
        disabled={confirmDisabled}
      >
        {confirmLabel}
      </button>
    </>
  )

  const node = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="ds-card ds-card-body modal-card" ref={dialogRef} tabIndex={-1} onKeyDown={onKeyDown}>
        <h3 id={titleId}>{title}</h3>
        <div id={descId} className="label" style={{ marginTop: 8, marginBottom: 12 }}>
          {message}
        </div>
        {children}
        <div className="d-flex modal-actions">
          {footer ?? defaultFooter}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') {
    return node
  }

  return createPortal(node, document.body)
}
