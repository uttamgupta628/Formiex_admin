import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LuLayoutDashboard, LuPackage, LuShoppingBag, LuUsers, LuMessageSquare, LuMail, LuSettings, LuLogOut, LuMenu, LuX } from 'react-icons/lu'
import { useAuth } from '../context/Auth'

const links = [
  { to: '/', label: 'Dashboard', icon: LuLayoutDashboard, end: true },
  { to: '/orders', label: 'Orders', icon: LuShoppingBag },
  { to: '/products', label: 'Products', icon: LuPackage },
  { to: '/customers', label: 'Customers', icon: LuUsers },
  { to: '/messages', label: 'Messages', icon: LuMessageSquare },
  { to: '/subscribers', label: 'Subscribers', icon: LuMail },
  { to: '/settings', label: 'Settings', icon: LuSettings },
]

export default function Layout() {
  const { admin, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-black text-white' : 'text-black/70 hover:bg-black/5'}`
          }
        >
          <Icon className="text-lg" /> {label}
        </NavLink>
      ))}
    </nav>
  )

  const footer = (
    <div className="border-t border-black/10 p-4">
      <p className="truncate text-sm font-medium text-black">{admin?.name}</p>
      <p className="truncate text-xs text-black/50">{admin?.email}</p>
      <button onClick={logout} className="mt-3 flex items-center gap-2 text-sm text-black/70 hover:text-black">
        <LuLogOut /> Sign out
      </button>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/10 bg-white lg:flex">
        <div className="px-6 py-6">
          <p className="font-display text-xl font-semibold tracking-[0.2em]">FORMIEX</p>
          <p className="text-xs text-black/50">Admin panel</p>
        </div>
        {nav}
        {footer}
      </aside>

      {/* mobile top bar + drawer */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-black/10 bg-white px-4 py-3 lg:hidden">
        <p className="font-display text-lg font-semibold tracking-[0.2em]">FORMIEX</p>
        <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="text-2xl">
          {open ? <LuX /> : <LuMenu />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="flex h-full w-64 flex-col bg-white pt-14" onClick={(e) => e.stopPropagation()}>
            {nav}
            {footer}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}