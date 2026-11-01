import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { LuX } from 'react-icons/lu'
import type { OrderStatus, PaymentStatus } from '../lib/api'

export const inputCls =
  'w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-black/5'

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'success'; small?: boolean }
export function Button({ variant = 'primary', small, className = '', ...rest }: BtnProps) {
  const styles = {
    primary: 'bg-black text-white hover:bg-black/80',
    ghost: 'border border-black/15 bg-white text-black hover:bg-black/5',
    danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  }[variant]
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'} ${styles} ${className}`}
    />
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-black">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-black/50">{hint}</span>}
    </label>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-black/10 bg-white p-5 shadow-sm ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-black sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-black/55">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

const TONES: Record<string, string> = {
  gray: 'bg-black/5 text-black/70',
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-sky-100 text-sky-800',
}
export function Badge({ tone = 'gray', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TONES[tone]}`}>{children}</span>
}

export const paymentBadge = (s: PaymentStatus) => (
  <Badge tone={{ pending: 'gray', submitted: 'amber', paid: 'green', failed: 'red' }[s]}>{s === 'submitted' ? 'needs verification' : s}</Badge>
)
export const orderBadge = (s: OrderStatus) => (
  <Badge tone={{ placed: 'gray', confirmed: 'blue', shipped: 'blue', delivered: 'green', cancelled: 'red' }[s]}>{s}</Badge>
)

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-xl hover:bg-black/5">
            <LuX />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Alert({ children, tone = 'red' }: { children: ReactNode; tone?: 'red' | 'green' }) {
  return (
    <div role="alert" className={`rounded-lg px-3.5 py-2.5 text-sm ${tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
      {children}
    </div>
  )
}

export function Spinner() {
  return <div className="py-16 text-center text-sm text-black/50">Loading…</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-14 text-center text-sm text-black/50">{children}</div>
}
