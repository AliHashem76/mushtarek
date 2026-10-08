import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/20 px-3 py-2 text-xs text-slate-300 transition hover:border-red-400/50 hover:text-red-300">
        <LogOut className="size-3.5" /> خروج
      </button>
    </form>
  )
}
