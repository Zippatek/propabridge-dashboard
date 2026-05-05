'use client'

import { Building2, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

// Single-screen Hausa support. The toggle lives where the language label
// belongs — at the corner of the welcome panel, the first thing a Hausa-
// first developer sees. No i18n library, no /[locale]/ routes — just the
// strings the screen needs.
//
// Choice persists to localStorage so subsequent visits remember it.

type Lang = 'en' | 'ha'

const STRINGS: Record<Lang, {
    badge: string
    headline: string
    sub: string
    bullet1: string
    bullet2: string
    bullet3: string
    footer: string
}> = {
    en: {
        badge: 'Agency',
        headline: 'Your portfolio, in front of qualified buyers.',
        sub: 'Propabridge sends you pre-screened buyers via WhatsApp. You close, you keep your full commission.',
        bullet1: 'Pre-qualified leads, scored by Propa AI before they reach you',
        bullet2: 'Self-serve portfolio — upload photos, prices, availability',
        bullet3: 'Commission ledger — track every closing, every payment',
        footer: 'Propabridge · Built by Zippatek Digital Ltd',
    },
    ha: {
        badge: 'Hukuma',
        headline: 'Kayanku, a gaban masu siye da aka tantance.',
        sub: 'Propabridge na kawo muku masu siye da aka tantance ta WhatsApp. Kuna rufewa, kuna riƙe duka kwamishan ɗinku.',
        bullet1: 'Masu siye da aka tantance — Propa AI ya ƙididdige su kafin su isa gare ku',
        bullet2: 'Sarrafa kanku — ɗora hotuna, farashi, da samuwa',
        bullet3: 'Lissafin kwamishan — bibiya kowane gama-gari da kowane biya',
        footer: 'Propabridge · An gina shi a Zippatek Digital Ltd',
    },
}

export function AgencyWelcomePanel() {
    const [lang, setLang] = useState<Lang>('en')

    useEffect(() => {
        const saved = (typeof window !== 'undefined' && window.localStorage.getItem('propa.lang')) as Lang | null
        if (saved === 'en' || saved === 'ha') setLang(saved)
    }, [])

    const choose = (l: Lang) => {
        setLang(l)
        if (typeof window !== 'undefined') window.localStorage.setItem('propa.lang', l)
    }

    const t = STRINGS[lang]

    return (
        <div className="hidden lg:flex lg:w-1/2 relative gradient-navy-radial">
            <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
                <div className="flex items-start justify-between">
                    <div className="text-h4">
                        <span className="font-bold text-white">PROPA</span>
                        <span className="font-bold text-action">BRIDGE</span>
                        <span className="ml-2 align-middle text-caption uppercase tracking-wider bg-gold/20 px-2 py-1 rounded text-gold">
                            {t.badge}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 bg-white/10 rounded-full p-1 text-[12px]">
                        <button
                            type="button"
                            onClick={() => choose('en')}
                            aria-pressed={lang === 'en'}
                            className={`px-3 py-1 rounded-full transition ${
                                lang === 'en' ? 'bg-white text-navy-900 font-semibold' : 'text-white/70 hover:text-white'
                            }`}
                        >
                            EN
                        </button>
                        <button
                            type="button"
                            onClick={() => choose('ha')}
                            aria-pressed={lang === 'ha'}
                            className={`px-3 py-1 rounded-full transition ${
                                lang === 'ha' ? 'bg-white text-navy-900 font-semibold' : 'text-white/70 hover:text-white'
                            }`}
                        >
                            HA
                        </button>
                    </div>
                </div>

                <div className="max-w-[480px]">
                    <h1 className="text-[36px] font-bold leading-tight tracking-tight">
                        {t.headline}
                    </h1>
                    <p className="mt-4 text-[16px] text-white/75 leading-relaxed">
                        {t.sub}
                    </p>

                    <ul className="mt-8 space-y-4 text-[15px] text-white/85">
                        <li className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-action/20 flex items-center justify-center text-action">
                                <Users size={16} strokeWidth={1.8} />
                            </span>
                            {t.bullet1}
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                                <Building2 size={16} strokeWidth={1.8} />
                            </span>
                            {t.bullet2}
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-verified/20 flex items-center justify-center text-verified">
                                <TrendingUp size={16} strokeWidth={1.8} />
                            </span>
                            {t.bullet3}
                        </li>
                    </ul>
                </div>

                <p className="text-caption text-white/50">{t.footer}</p>
            </div>
        </div>
    )
}
