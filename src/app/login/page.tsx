import Image from 'next/image'
import { Suspense } from 'react'
import { ShieldCheck } from 'lucide-react'
import LoginForm from './login-form'

function LoginContent() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A1128] px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#1C2541]/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-[#00F2FE]">
            <Image src="/icon.svg" alt="Mushtarak" width={32} height={32} priority />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">مرحباً بك في مشترك</h1>
          <p className="mt-2 text-sm text-slate-400">أدِر مشتركيك وفواتيرك بنقرة واحدة</p>
        </div>

        <LoginForm />

        <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-800/80 pt-6 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-[#00F2FE]" />
          <span>اتصال آمن • النظام يعمل</span>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A1128]" />}>
      <LoginContent />
    </Suspense>
  )
}