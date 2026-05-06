import { Suspense } from 'react'
import { ShieldCheck, Activity, MessageSquare } from 'lucide-react'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

export const metadata = {
  title: 'Propabridge Admin — Sign In',
  description: 'Admin sign-in for the Propabridge control panel.',
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative gradient-navy-radial">
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <div className="text-h4">
            <span className="font-bold text-white">PROPA</span>
            <span className="font-bold text-action">BRIDGE</span>
            <span className="ml-2 align-middle text-caption uppercase tracking-wider bg-white/10 px-2 py-1 rounded text-white/80">
              Admin
            </span>
          </div>

          <div className="max-w-[480px]">
            <h1 className="text-[36px] font-bold leading-tight tracking-tight text-white">
              The control room for Propabridge.
            </h1>
            <p className="mt-4 text-[16px] text-white/75 leading-relaxed">
              Monitor user inquiries, inspections, AI conversations, and lead pipelines —
              all in one place.
            </p>

            <ul className="mt-8 space-y-4 text-[15px] text-white/85">
              <li className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-action/20 flex items-center justify-center text-action">
                  <Activity size={16} strokeWidth={1.8} />
                </span>
                Real-time chat monitor with live transcript streaming
              </li>
              <li className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                  <ShieldCheck size={16} strokeWidth={1.8} />
                </span>
                Lead pipeline, inspections, and inquiry management
              </li>
              <li className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-verified/20 flex items-center justify-center text-verified">
                  <MessageSquare size={16} strokeWidth={1.8} />
                </span>
                WhatsApp template registry — search, edit, deploy
              </li>
            </ul>
          </div>

          <p className="text-caption text-white/50">
            Propabridge · Built by Zippatek Digital Ltd
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
