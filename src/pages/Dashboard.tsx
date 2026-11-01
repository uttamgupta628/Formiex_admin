import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Dashboard as D } from '../lib/api'
import { inr, dateTime } from '../lib/format'
import { Alert, Card, PageHeader, Spinner, orderBadge, paymentBadge } from '../components/ui'

export default function Dashboard() {
  const [data, setData] = useState<D | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <Alert>{error}</Alert>
  if (!data) return <Spinner />
  const t = data.totals

  const stats = [
    { label: 'Revenue (verified)', value: inr(t.revenue), sub: `${t.paidOrders} paid orders` },
    { label: 'Total orders', value: t.orders, to: '/orders' },
    { label: 'Payments to verify', value: t.pendingVerification, to: '/orders?paymentStatus=submitted', highlight: t.pendingVerification > 0 },
    { label: 'Products', value: t.products, to: '/products' },
    { label: 'Unread messages', value: t.unreadMessages, to: '/messages', highlight: t.unreadMessages > 0 },
    { label: 'Subscribers', value: t.subscribers, to: '/subscribers' },
  ]
  const max = Math.max(1, ...data.daily.map((d) => d.revenue))

  return (
    <>
      <PageHeader title="Dashboard" subtitle="How the store is doing" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => {
          const body = (
            <Card className={s.highlight ? 'border-amber-300 bg-amber-50' : ''}>
              <p className="text-sm text-black/55">{s.label}</p>
              <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{s.value}</p>
              {s.sub && <p className="mt-1 text-xs text-black/45">{s.sub}</p>}
            </Card>
          )
          return s.to ? (
            <Link key={s.label} to={s.to} className="block transition hover:-translate-y-0.5">
              {body}
            </Link>
          ) : (
            <div key={s.label}>{body}</div>
          )
        })}
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-lg font-semibold">Verified revenue · last 30 days</h2>
        {data.daily.length === 0 ? (
          <p className="py-10 text-center text-sm text-black/50">No verified payments yet.</p>
        ) : (
          <div className="mt-5 flex h-40 items-end gap-1.5" role="img" aria-label="Daily revenue bar chart">
            {data.daily.map((d) => (
              <div key={d.date} className="group relative flex h-full flex-1 items-end">
                <div className="w-full rounded-t bg-black transition group-hover:bg-black/70" style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%` }} />
                <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white group-hover:block">
                  {d.date}: {inr(d.revenue)} ({d.orders})
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent orders</h2>
            <Link to="/orders" className="text-sm underline underline-offset-4">View all</Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-black/50">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-black/10">
              {data.recentOrders.map((o) => (
                <li key={o._id}>
                  <Link to={`/orders?open=${o._id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-black/[0.02]">
                    <div>
                      <p className="text-sm font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-black/50">{o.customer.name} · {dateTime(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {paymentBadge(o.payment.status)}
                      {orderBadge(o.orderStatus)}
                      <span className="w-20 text-right text-sm font-medium">{inr(o.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="font-display text-lg font-semibold">Low stock</h2>
          {data.lowStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-black/50">All products are well stocked.</p>
          ) : (
            <ul className="mt-3 divide-y divide-black/10">
              {data.lowStock.map((p) => (
                <li key={p._id} className="flex justify-between py-2.5 text-sm">
                  <span>{p.name}</span>
                  <span className={p.stock === 0 ? 'font-semibold text-red-600' : 'font-medium text-amber-700'}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
