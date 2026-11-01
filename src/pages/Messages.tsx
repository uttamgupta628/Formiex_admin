import { useCallback, useEffect, useState } from 'react'
import { LuTrash2, LuMailOpen, LuMail } from 'react-icons/lu'
import { api, type Message } from '../lib/api'
import { dateTime } from '../lib/format'
import { Alert, Badge, Button, Card, Empty, PageHeader, Spinner } from '../components/ui'

export default function Messages() {
  const [list, setList] = useState<Message[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(() => api.messages().then(setList).catch((e) => setError(e.message)), [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const toggleOpen = async (m: Message) => {
    setOpen(open === m._id ? null : m._id)
    if (!m.isRead) {
      await api.markMessage(m._id, true).catch(() => {})
      load()
    }
  }

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn()
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed')
    }
  }

  return (
    <>
      <PageHeader title="Messages" subtitle="Enquiries from the Contact page." />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {!list ? <Spinner /> : list.length === 0 ? <Card><Empty>No messages yet.</Empty></Card> : (
        <Card className="p-0">
          <ul className="divide-y divide-black/10">
            {list.map((m) => (
              <li key={m._id}>
                <button onClick={() => toggleOpen(m)} className={`flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-black/[0.02] ${m.isRead ? '' : 'bg-amber-50/60'}`}>
                  <span className={`text-lg ${m.isRead ? 'text-black/30' : 'text-black'}`}>{m.isRead ? <LuMailOpen /> : <LuMail />}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${m.isRead ? '' : 'font-semibold'}`}>{m.name} <span className="font-normal text-black/50">· {m.email}</span></p>
                    <p className="truncate text-sm text-black/60">{m.message}</p>
                  </div>
                  {m.topic && <span className="hidden sm:block"><Badge>{m.topic}</Badge></span>}
                  <span className="hidden text-xs text-black/45 sm:block">{dateTime(m.createdAt)}</span>
                </button>
                {open === m._id && (
                  <div className="border-t border-black/5 bg-black/[0.02] px-5 py-4 text-sm">
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    <p className="mt-3 text-xs text-black/55">
                      {m.phone && <>Phone: {m.phone} · </>}{m.orderNumber && <>Order: {m.orderNumber} · </>}{dateTime(m.createdAt)}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Formiex')}`} className="inline-flex items-center rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80">Reply by email</a>
                      <Button small variant="ghost" onClick={() => act(() => api.markMessage(m._id, !m.isRead))}>Mark as {m.isRead ? 'unread' : 'read'}</Button>
                      <Button small variant="danger" onClick={() => confirm('Delete this message?') && act(() => api.deleteMessage(m._id))}><LuTrash2 /> Delete</Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
