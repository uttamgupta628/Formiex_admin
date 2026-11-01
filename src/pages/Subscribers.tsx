import { useCallback, useEffect, useState } from 'react'
import { LuDownload, LuTrash2 } from 'react-icons/lu'
import { api, type Subscriber } from '../lib/api'
import { dateOnly } from '../lib/format'
import { Alert, Button, Card, Empty, PageHeader, Spinner } from '../components/ui'

export default function Subscribers() {
  const [list, setList] = useState<Subscriber[] | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(() => api.subscribers().then(setList).catch((e) => setError(e.message)), [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const exportCsv = () => {
    if (!list) return
    const csv = 'email,subscribed_on\n' + list.map((s) => `${s.email},${s.createdAt.slice(0, 10)}`).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'formiex-subscribers.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <PageHeader title="Subscribers" subtitle="People who signed up for the newsletter in the website footer." action={<Button variant="ghost" onClick={exportCsv} disabled={!list?.length}><LuDownload /> Export CSV</Button>} />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {!list ? <Spinner /> : list.length === 0 ? <Card><Empty>No subscribers yet.</Empty></Card> : (
        <Card className="p-0">
          <ul className="divide-y divide-black/10">
            {list.map((s) => (
              <li key={s._id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>{s.email}</span>
                <span className="flex items-center gap-4"><span className="text-xs text-black/50">{dateOnly(s.createdAt)}</span>
                  <button aria-label={`Remove ${s.email}`} className="text-black/40 hover:text-red-600" onClick={async () => { if (confirm(`Remove ${s.email}?`)) { await api.deleteSubscriber(s._id).catch(() => {}); load() } }}><LuTrash2 /></button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
