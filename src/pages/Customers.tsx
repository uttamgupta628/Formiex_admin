import { useEffect, useState } from 'react'
import { LuSearch } from 'react-icons/lu'
import { api, type CustomerRow } from '../lib/api'
import { inr, dateOnly } from '../lib/format'
import { Alert, Button, Card, Empty, PageHeader, Spinner, inputCls } from '../components/ui'

export default function Customers() {
  const [data, setData] = useState<{ customers: CustomerRow[]; total: number; pages: number } | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(
      () => {
        api
          .customers({ q, page, limit: 20 })
          .then((d) => {
            setData(d)
            setError('')
          })
          .catch((e) => setError(e.message))
      },
      q ? 300 : 0, // debounce search typing
    )
    return () => clearTimeout(t)
  }, [q, page])

  return (
    <>
      <PageHeader title="Customers" subtitle="People who created an account on the website." />
      <Card className="mb-4">
        <div className="relative">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name, email or phone"
            aria-label="Search customers"
            className={`${inputCls} pl-9`}
          />
        </div>
      </Card>

      {error && <Alert>{error}</Alert>}
      {!data ? (
        <Spinner />
      ) : data.customers.length === 0 ? (
        <Card>
          <Empty>{q ? 'No customers match your search.' : 'No customers have signed up yet.'}</Empty>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Paid total</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {data.customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.name}</p>
                    <a href={`mailto:${c.email}`} className="text-xs text-black/55 underline underline-offset-2">
                      {c.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-black/70">{c.address.city ? `${c.address.city}, ${c.address.state}` : '—'}</td>
                  <td className="px-4 py-3">{c.orders}</td>
                  <td className="px-4 py-3 font-medium">{inr(c.spent)}</td>
                  <td className="px-4 py-3 text-black/60">{dateOnly(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-black/10 px-4 py-3 text-sm">
            <span className="text-black/55">
              {data.total} customer{data.total === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2">
              <Button small variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span>
                Page {page} of {data.pages}
              </span>
              <Button small variant="ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}