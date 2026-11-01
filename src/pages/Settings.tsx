import { useEffect, useState, type FormEvent } from 'react'
import { api, type Settings as S } from '../lib/api'
import { Alert, Button, Card, Field, PageHeader, Spinner, inputCls } from '../components/ui'

export default function Settings() {
  const [s, setS] = useState<S | null>(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.settings().then(setS).catch((e) => setError(e.message))
  }, [])

  if (!s) return error ? <Alert>{error}</Alert> : <Spinner />

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setOk('')
    try {
      setS(await api.saveSettings(s))
      setOk('Settings saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }
  const upi = (k: keyof S['upi'], v: string | boolean) => setS({ ...s, upi: { ...s.upi, [k]: v } })

  return (
    <>
      <PageHeader title="Settings" subtitle="Payment, shipping and store details." />
      <form onSubmit={save} className="space-y-6">
        {error && <Alert>{error}</Alert>}
        {ok && <Alert tone="green">{ok}</Alert>}

        <Card className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">UPI payments</h2>
            <p className="mt-1 text-sm text-black/55">Customers see a QR code and “Open UPI app” button for this UPI ID at checkout. You confirm each payment manually in Orders after checking your bank / UPI app.</p>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.upi.enabled} onChange={(e) => upi('enabled', e.target.checked)} className="h-4 w-4 accent-black" /> Accept UPI payments</label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your UPI ID" hint="e.g. formiex@okhdfcbank or 9876543210@ybl"><input value={s.upi.upiId} onChange={(e) => upi('upiId', e.target.value)} placeholder="yourname@bank" className={inputCls} /></Field>
            <Field label="Payee name" hint="Shown to the customer in their UPI app."><input value={s.upi.payeeName} onChange={(e) => upi('payeeName', e.target.value)} maxLength={80} className={inputCls} /></Field>
          </div>
          <Field label="Extra instructions (optional)" hint="Shown under the QR code, e.g. “Please don’t close the page until you’ve entered the UTR”."><textarea rows={2} maxLength={500} value={s.upi.instructions} onChange={(e) => upi('instructions', e.target.value)} className={inputCls} /></Field>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Shipping</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shipping fee (₹)" hint="0 = free shipping"><input type="number" min={0} value={s.shippingFee} onChange={(e) => setS({ ...s, shippingFee: Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Free shipping above (₹)" hint="0 = never free (when a fee is set)"><input type="number" min={0} value={s.freeShippingAbove} onChange={(e) => setS({ ...s, freeShippingAbove: Number(e.target.value) })} className={inputCls} /></Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Store</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Store name"><input value={s.storeName} onChange={(e) => setS({ ...s, storeName: e.target.value })} className={inputCls} /></Field>
            <Field label="Contact email"><input type="email" value={s.contactEmail} onChange={(e) => setS({ ...s, contactEmail: e.target.value })} className={inputCls} /></Field>
            <Field label="Contact phone"><input value={s.contactPhone} onChange={(e) => setS({ ...s, contactPhone: e.target.value })} className={inputCls} /></Field>
          </div>
        </Card>

        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</Button>
      </form>

      <PasswordCard />
    </>
  )
}

function PasswordCard() {
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await api.changePassword(cur, next)
      setMsg({ ok: true, text: 'Password changed.' })
      setCur('')
      setNext('')
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not change password' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-6">
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Change password</h2>
        {msg && <Alert tone={msg.ok ? 'green' : 'red'}>{msg.text}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current password"><input type="password" required autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} /></Field>
          <Field label="New password" hint="At least 8 characters"><input type="password" required minLength={8} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} /></Field>
        </div>
        <Button type="submit" variant="ghost" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</Button>
      </Card>
    </form>
  )
}
