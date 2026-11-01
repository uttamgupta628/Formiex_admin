import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { LuPlus, LuPencil, LuTrash2, LuUpload, LuX, LuImage } from 'react-icons/lu'
import { api, type Img, type Product } from '../lib/api'
import { inr } from '../lib/format'
import { Alert, Badge, Button, Card, Empty, Field, Modal, PageHeader, Spinner, inputCls } from '../components/ui'

const blank = { name: '', desc: '', longDesc: '', price: '', stock: '100', category: 'sunscreen', isActive: true }
const noImg: Img = { url: '', publicId: '' }

export default function Products() {
  const [list, setList] = useState<Product[] | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)

  const load = useCallback(() => api.products().then(setList).catch((e) => setError(e.message)), [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This also removes its images. Existing orders keep their copy of the product.`)) return
    try {
      await api.deleteProduct(p.id)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const toggle = async (p: Product) => {
    try {
      await api.updateProduct(p.id, { isActive: !p.isActive })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Anything you add or change here shows up on the website immediately."
        action={<Button onClick={() => setEditing('new')}><LuPlus /> Add product</Button>}
      />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {!list ? (
        <Spinner />
      ) : list.length === 0 ? (
        <Card><Empty>No products yet. Click “Add product” to create your first one.</Empty></Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/5">
                        {p.image.url && <img src={p.image.url} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="max-w-xs truncate text-xs text-black/50">{p.desc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{p.category}</td>
                  <td className="px-4 py-3 font-medium">{inr(p.price)}</td>
                  <td className="px-4 py-3">{p.stock === 0 ? <Badge tone="red">Out of stock</Badge> : p.stock <= 10 ? <Badge tone="amber">{p.stock} left</Badge> : p.stock}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(p)} title="Click to toggle" className="focus:outline-none">
                      <Badge tone={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Visible' : 'Hidden'}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button small variant="ghost" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><LuPencil /></Button>
                      <Button small variant="danger" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><LuTrash2 /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </>
  )
}

function ImagePicker({ label, value, onChange, required }: { label: string; value: Img; onChange: (i: Img) => void; required?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true)
    setErr('')
    try {
      onChange(await api.uploadImage(file))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}{required && ' *'}</span>
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-dashed border-black/25 bg-black/[0.03]">
        {value.url ? (
          <>
            <img src={value.url} alt={label} className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(noImg)} aria-label={`Remove ${label}`} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black">
              <LuX />
            </button>
          </>
        ) : (
          <div className="text-center text-black/40"><LuImage className="mx-auto text-3xl" /><p className="mt-1 text-xs">No image</p></div>
        )}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm">Uploading…</div>}
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <Button type="button" variant="ghost" small className="mt-2 w-full" disabled={busy} onClick={() => ref.current?.click()}>
        <LuUpload /> {value.url ? 'Replace' : 'Upload'}
      </Button>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  )
}

function ProductForm({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(
    product
      ? { name: product.name, desc: product.desc, longDesc: product.longDesc, price: String(product.price), stock: String(product.stock), category: product.category, isActive: product.isActive }
      : blank,
  )
  const [image, setImage] = useState<Img>(product?.image ?? noImg)
  const [hoverImage, setHoverImage] = useState<Img>(product?.hoverImage ?? noImg)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof blank, v: string | boolean) => setF((p) => ({ ...p, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!image.url) return setError('Please upload a main product image')
    setBusy(true)
    setError('')
    const payload = { ...f, price: Number(f.price), stock: Number(f.stock), image, hoverImage }
    try {
      if (product) await api.updateProduct(product.id, payload)
      else await api.createProduct(payload)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setBusy(false)
    }
  }

  return (
    <Modal title={product ? `Edit ${product.name}` : 'Add product'} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Name"><input required maxLength={120} value={f.name} onChange={(e) => set('name', e.target.value)} className={inputCls} /></Field>
          <Field label="Short description" hint="Shown under the product name on the website."><input required maxLength={500} value={f.desc} onChange={(e) => set('desc', e.target.value)} className={inputCls} /></Field>
          <Field label="Details (optional)"><textarea rows={3} maxLength={5000} value={f.longDesc} onChange={(e) => set('longDesc', e.target.value)} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₹)"><input required type="number" min={0} step="0.01" value={f.price} onChange={(e) => set('price', e.target.value)} className={inputCls} /></Field>
            <Field label="Stock"><input required type="number" min={0} step={1} value={f.stock} onChange={(e) => set('stock', e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Category" hint="“sunscreen” and “moisturizer” appear on their own pages; any category appears under All Products.">
            <input required list="cats" value={f.category} onChange={(e) => set('category', e.target.value)} className={inputCls} />
            <datalist id="cats"><option value="sunscreen" /><option value="moisturizer" /></datalist>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 accent-black" /> Visible on the website</label>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
          <ImagePicker label="Main image" value={image} onChange={setImage} required />
          <ImagePicker label="Hover image" value={hoverImage} onChange={setHoverImage} />
        </div>
        <div className="flex justify-end gap-3 border-t border-black/10 pt-4 md:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : product ? 'Save changes' : 'Create product'}</Button>
        </div>
      </form>
    </Modal>
  )
}
