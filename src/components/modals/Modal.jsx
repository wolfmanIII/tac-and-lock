/**
 * Modal — generic wrapper.
 * variant="dialog" (default): full-screen backdrop, centered.
 * variant="panel": no backdrop, anchored bottom-right; battle content remains visible.
 */

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * @param {{
 *   onClose?: () => void,
 *   children: React.ReactNode,
 *   title?: string,
 *   width?: string,
 *   variant?: 'dialog' | 'panel',
 * }} props
 */
export function Modal({ onClose, children, title, width = 'max-w-lg', variant = 'dialog' }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && onClose) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => { panelRef.current?.focus() }, [])

  if (variant === 'panel') {
    return createPortal(
      <div className={`fixed bottom-10 right-4 z-50 w-full ${width} pointer-events-auto`}>
        <div
          ref={panelRef}
          tabIndex={-1}
          className="relative bg-gunmetal-900 border border-gunmetal-700 rounded-lg shadow-2xl outline-none max-h-[calc(100vh-4rem)] flex flex-col"
        >
          {title && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-gunmetal-700 shrink-0">
              <h2 className="font-mono text-sm text-bronze-400 tracking-widest uppercase">{title}</h2>
              {onClose && (
                <button onClick={onClose} className="text-gunmetal-400 hover:text-gunmetal-200 font-mono text-lg leading-none transition-colors" aria-label="Close">×</button>
              )}
            </div>
          )}
          <div className="overflow-y-auto">{children}</div>
        </div>
      </div>,
      document.body,
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto"
      onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose() }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${width} bg-gunmetal-900 border border-gunmetal-700 rounded-lg shadow-2xl outline-none max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gunmetal-700 shrink-0">
            <h2 className="font-mono text-sm text-bronze-400 tracking-widest uppercase">{title}</h2>
            {onClose && (
              <button onClick={onClose} className="text-gunmetal-400 hover:text-gunmetal-200 font-mono text-lg leading-none transition-colors" aria-label="Close">×</button>
            )}
          </div>
        )}
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
