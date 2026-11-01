import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LuSearch, LuExternalLink } from 'react-icons/lu'
import { api, type Order, type OrderStatus } from '../lib/api'
import { inr, dateTime } from '../lib/format'
import { Alert, Button, Card, Empty, Field, Modal, PageHeader, Spinner, inputCls, orderBadge, paymentBadge } from '../components/ui'

const ORDER_STATUSES: OrderStatus[] = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function Orders() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState<{ orders: Order[]; total: number; pages: number } | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState(params.get('q') || '')
  const [status, setStatus] = useState(params.get('status') || '')
  const [paymentStatus, setPaymentStatus] = useState(params.get('paymentStatus') || '')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Order | null>(null)

  const load = useCallback(() => {
    api
      .orders({ q, status, paymentStatus, page, limit: 15 })
      .then((d) => {
        setData(d)
        setError('')
      })
      .catch((e) => setError(e.message))
  }, [q, status, paymentStatus, page])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0) // debounce search typing
    return () => clearTimeout(t)
  }, [load, q])

  // open an order directly from a dashboard link (?open=<id>)
  const openId = params.get('open')
  useEffect(() => {
    if (!openId) return
    api.orders({ q: '', page: 1, limit: 100 }).then((d) => {
      const o = d.orders.find((x) => x._id === openId)
      if (o) setSelected(o)
    }).catch(() => {})
    setParams((p) => { p.delete('open'); return p }, { replace: true })
  }, [openId, setParams])

  const reset = (fn: () => void) => { fn(); setPage(1) }

  return (
    <>
      <PageHeader title="Orders" subtitle="Verify UPI payments, then confirm and ship orders." />
      <Card className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
          <input value={q} onChange={(e) => reset(() => setQ(e.target.value))} placeholder="Search order no., name, phone, email, UTR" className={`${inputCls} pl-9`} aria-label="Search orders" />
        </div>
        <select value={paymentStatus} onChange={(e) => reset(() => setPaymentStatus(e.target.value))} className={`${inputCls} w-auto`} aria-label="Payment status">
          <option value="">All payments</option>
          <option value="submitted">Needs verification</option>
          <option value="pending">Awaiting payment</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
        <select value={status} onChange={(e) => reset(() => setStatus(e.target.value))} className={`${inputCls} w-auto`} aria-label="Order status">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </Card>

      {error && <Alert>{error}</Alert>}
      {!data ? (
        <Spinner />
      ) : data.orders.length === 0 ? (
        <Card><Empty>No orders match.</Empty></Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
              <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Placed</th></tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {data.orders.map((o) => (
                <tr key={o._id} onClick={() => setSelected(o)} className="cursor-pointer hover:bg-black/[0.03]">
                  <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                  <td className="px-4 py-3">{o.customer.name}<span className="block text-xs text-black/50">{o.customer.phone}</span></td>
                  <td className="px-4 py-3 font-medium">{inr(o.total)}</td>
                  <td className="px-4 py-3">{paymentBadge(o.payment.status)}</td>
                  <td className="px-4 py-3">{orderBadge(o.orderStatus)}</td>
                  <td className="px-4 py-3 text-black/60">{dateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-black/10 px-4 py-3 text-sm">
            <span className="text-black/55">{data.total} order{data.total === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-2">
              <Button small variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span>Page {page} of {data.pages}</span>
              <Button small variant="ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </Card>
      )}

      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} onChanged={(o) => { setSelected(o); load() }} />}
    </>
  )
}

function OrderModal({ order, onClose, onChanged }: { order: Order; onClose: () => void; onChanged: (o: Order) => void }) {
  const [status, setStatus] = useState<OrderStatus>(order.orderStatus)
  const [tracking, setTracking] = useState(order.trackingNumber || '')
  const [note, setNote] = useState(order.payment.adminNote || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const run = async (fn: () => Promise<Order>, msg: string) => {
    setBusy(true)
    setError('')
    setOk('')
    try {
      const o = await fn()
      onChanged(o)
      setStatus(o.orderStatus)
      setOk(msg)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const p = order.payment
  const a = order.shippingAddress
  const cancelled = order.orderStatus === 'cancelled'

  return (
    <Modal title={`Order ${order.orderNumber}`} onClose={onClose} wide>
      <div className="space-y-5">
        {error && <Alert>{error}</Alert>}
        {ok && <Alert tone="green">{ok}</Alert>}

        {/* payment verification */}
        <section className="rounded-xl border border-black/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display font-semibold">UPI payment</h3>
            {paymentBadge(p.status)}
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="text-black/50">Amount to receive</dt><dd className="text-base font-semibold">{inr(order.total)}</dd></div>
            <div><dt className="text-black/50">Paid to UPI ID</dt><dd>{p.upiId || '—'}</dd></div>
            <div><dt className="text-black/50">Customer's UTR / transaction ID</dt><dd className="font-mono text-base">{p.utr || 'Not submitted yet'}</dd></div>
            <div><dt className="text-black/50">Submitted</dt><dd>{dateTime(p.submittedAt)}</dd></div>
          </dl>
          {p.screenshot?.url && (
            <a href={p.screenshot.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm underline underline-offset-4">
              <LuExternalLink /> View payment screenshot
            </a>
          )}
          {!cancelled && p.status !== 'paid' && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              Open your UPI app / bank statement, find a credit of <strong>{inr(order.total)}</strong>{p.utr && <> with reference <strong>{p.utr}</strong></>}, then mark it paid. Only mark as paid after the money is in your account.
            </p>
          )}
          {!cancelled && (
            <div className="mt-3 space-y-3">
              <Field label="Internal note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} maxLength={500} /></Field>
              <div className="flex flex-wrap gap-2">
                {p.status !== 'paid' && <Button variant="success" disabled={busy} onClick={() => run(() => api.setPaymentStatus(order._id, 'paid', note), 'Payment marked as paid — order confirmed.')}>Mark as paid</Button>}
                {p.status !== 'failed' && p.status !== 'paid' && <Button variant="danger" disabled={busy} onClick={() => run(() => api.setPaymentStatus(order._id, 'failed', note), 'Marked as failed. The customer can resubmit a UTR.')}>Payment not received</Button>}
                {p.status === 'paid' && <Button variant="ghost" disabled={busy} onClick={() => run(() => api.setPaymentStatus(order._id, 'pending', note), 'Payment reset to pending.')}>Undo paid</Button>}
              </div>
            </div>
          )}
        </section>

        {/* fulfilment */}
        <section className="rounded-xl border border-black/10 p-4">
          <h3 className="font-display font-semibold">Fulfilment</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Order status">
              <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} disabled={cancelled} className={`${inputCls} capitalize`}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Tracking number"><input value={tracking} onChange={(e) => setTracking(e.target.value)} disabled={cancelled} className={inputCls} maxLength={100} /></Field>
          </div>
          {status === 'cancelled' && !cancelled && <p className="mt-2 text-xs text-red-700">Cancelling returns the items to stock and can't be undone.</p>}
          <Button className="mt-3" disabled={busy || cancelled} onClick={() => run(() => api.setOrderStatus(order._id, { orderStatus: status, trackingNumber: tracking }), 'Order updated.')}>Save</Button>
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
          <section className="rounded-xl border border-black/10 p-4 text-sm">
            <h3 className="font-display font-semibold">Customer</h3>
            <p className="mt-2">{order.customer.name}</p>
            <p><a className="underline" href={`mailto:${order.customer.email}`}>{order.customer.email}</a></p>
            <p><a className="underline" href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></p>
            <p className="mt-3 text-black/70">{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} – {a.pincode}</p>
            {order.notes && <p className="mt-3 rounded bg-black/5 p-2 text-xs">Note: {order.notes}</p>}
          </section>
          <section className="rounded-xl border border-black/10 p-4 text-sm">
            <h3 className="font-display font-semibold">Items</h3>
            <ul className="mt-2 space-y-2">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  {i.img && <img src={i.img} alt="" className="h-10 w-10 rounded object-cover" />}
                  <span className="flex-1">{i.name} × {i.qty}</span>
                  <span>{inr(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-black/10 pt-3">
              <div className="flex justify-between"><span>Shipping</span><span>{order.shipping ? inr(order.shipping) : 'Free'}</span></div>
              <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{inr(order.total)}</span></div>
            </div>
          </section>
        </div>
      </div>
    </Modal>
  )
}
