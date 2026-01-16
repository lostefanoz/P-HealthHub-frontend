import type { AriaRole, CSSProperties, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

type AnchoredPopoverProps = {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  children: ReactNode
  id?: string
  role?: AriaRole
  ariaLabel?: string
  className?: string
  style?: CSSProperties
  offset?: number
  zIndex?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function AnchoredPopover({
  open,
  anchorEl,
  onClose,
  children,
  id,
  role = 'dialog',
  ariaLabel,
  className,
  style,
  offset = 8,
  zIndex = 40,
}: AnchoredPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastActive = useRef<HTMLElement | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null)

  const updatePosition = useCallback(() => {
    if (!anchorEl) return
    const pop = popoverRef.current
    if (!pop) return

    const pad = 8
    const anchorRect = anchorEl.getBoundingClientRect()
    const popRect = pop.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    const belowTop = anchorRect.bottom + offset
    const aboveTop = anchorRect.top - popRect.height - offset
    const canOpenAbove = aboveTop >= pad
    const wouldOverflowBelow = belowTop + popRect.height > vh - pad
    const openAbove = wouldOverflowBelow && canOpenAbove

    const top = openAbove ? aboveTop : belowTop
    const maxHeight = openAbove ? anchorRect.top - offset - pad : vh - top - pad

    const maxLeft = vw - pad - popRect.width
    const left = clamp(anchorRect.left, pad, Math.max(pad, maxLeft))

    setPos({ top: Math.round(top), left: Math.round(left), maxHeight: Math.max(120, Math.round(maxHeight)) })
  }, [anchorEl, offset])

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      updatePosition()
    })
  }, [updatePosition])

  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setPos(null)
      return
    }
    lastActive.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    scheduleUpdate()
  }, [open, anchorEl, scheduleUpdate])

  useLayoutEffect(() => {
    if (!open || !anchorEl) return
    const pop = popoverRef.current
    if (!pop) return
    const focusable = pop.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    ;(focusable ?? pop).focus?.()
  }, [open, anchorEl])

  useEffect(() => {
    if (!open || !anchorEl) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      const pop = popoverRef.current
      if (pop?.contains(target)) return
      if (anchorEl.contains(target)) return
      onClose()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    const onScroll = () => scheduleUpdate()
    const onResize = () => scheduleUpdate()

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      lastActive.current?.focus?.()
    }
  }, [open, anchorEl, onClose, scheduleUpdate])

  if (!open || !anchorEl) return null

  const node = (
    <div
      ref={popoverRef}
      id={id}
      role={role}
      aria-label={ariaLabel}
      tabIndex={-1}
      className={className}
      style={{
        position: 'fixed',
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        zIndex,
        maxHeight: pos?.maxHeight ?? undefined,
        overflow: 'auto',
        ...style,
      }}
    >
      {children}
    </div>
  )

  if (typeof document === 'undefined') return node
  return createPortal(node, document.body)
}
