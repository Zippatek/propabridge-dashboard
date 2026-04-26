'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, ChevronRight, User, Bell, SlidersHorizontal, Shield, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { mockUser } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Profile', icon: User },
  { label: 'Notifications', icon: Bell },
  { label: 'Preferences', icon: SlidersHorizontal },
  { label: 'Account', icon: Shield },
] as const
type SettingsTab = typeof tabs[number]['label']

const preferredAreas = [
  'Gwarinpa',
  'Maitama',
  'Jabi',
  'Lokogoma',
  'Wuse',
  'Asokoro',
  'Garki',
  'Kubwa',
  'Lugbe',
]

/**
 * Settings Page
 * FOUNDATION.md Section 8.5
 */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Profile')
  const [notifications, setNotifications] = useState({
    newListings: true,
    inspection24h: true,
    inspection1h: true,
    propaWhatsApp: false,
    weeklyGuides: true,
    savedAreas: true,
  })
  const [propertyIntent, setPropertyIntent] = useState<'rent' | 'buy' | 'invest'>('buy')
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['Gwarinpa', 'Maitama', 'Jabi'])
  const [bedrooms, setBedrooms] = useState(3)

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-h1 text-navy">Settings</h1>

      {/* ─── Tab Navigation ──────────────────────────── */}
      <div className="flex gap-1 bg-white rounded-[12px] p-1.5 w-fit border border-divider overflow-x-auto scrollbar-hide shadow-sm">
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-body-sm font-medium transition-all duration-200 whitespace-nowrap',
                activeTab === tab.label
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-subtle hover:text-navy hover:bg-beige/50'
              )}
            >
              <TabIcon size={15} strokeWidth={1.5} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ─── Tab Content ─────────────────────────────── */}
      <div className="bg-white rounded-card shadow-card p-8 animate-scale-in" key={activeTab}>
        {/* PROFILE TAB */}
        {activeTab === 'Profile' && (
          <div className="space-y-8 max-w-[600px]">
            {/* Avatar upload */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-20 h-20 rounded-avatar overflow-hidden bg-beige ring-4 ring-beige/50">
                  <Image
                    src="/images/avatar-default.jpg"
                    alt={mockUser.name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
                <button className="absolute inset-0 bg-navy/50 rounded-avatar flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:scale-105">
                  <Camera size={20} className="text-white" strokeWidth={1.5} />
                </button>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-verified flex items-center justify-center border-2 border-white">
                  <span className="text-white text-[10px]">✓</span>
                </div>
              </div>
              <div>
                <p className="text-h4 text-navy">{mockUser.name}</p>
                <p className="text-caption text-subtle">{mockUser.email}</p>
                <p className="text-[11px] text-verified font-medium mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-verified" />
                  Verified account
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="First name" defaultValue="Aminu" />
              <Input label="Last name" defaultValue="Ibrahim" />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Email"
                  defaultValue={mockUser.email}
                  disabled
                  className="opacity-60"
                />
              </div>
              <button className="text-body-sm font-semibold text-action hover:text-action-hover pb-3 transition-colors duration-150">
                Change
              </button>
            </div>
            <Input label="WhatsApp number" defaultValue={mockUser.phone} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-nav font-medium text-navy mb-2">State</label>
                <select className="w-full px-4 py-3 rounded-input border border-divider bg-white text-navy text-body focus:outline-none focus:ring-2 focus:ring-action transition-all duration-150">
                  <option>FCT - Abuja</option>
                  <option>Kaduna</option>
                  <option>Niger</option>
                </select>
              </div>
              <div>
                <label className="block text-nav font-medium text-navy mb-2">City</label>
                <select className="w-full px-4 py-3 rounded-input border border-divider bg-white text-navy text-body focus:outline-none focus:ring-2 focus:ring-action transition-all duration-150">
                  <option>Abuja</option>
                  <option>Kaduna</option>
                  <option>Minna</option>
                </select>
              </div>
            </div>
            <Button variant="primary" className="group">
              Save Changes <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'Notifications' && (
          <div className="space-y-6 max-w-[600px]">
            <div>
              <h3 className="text-h3 text-navy mb-1">Notification Preferences</h3>
              <p className="text-body text-subtle">Choose what updates you receive</p>
            </div>
            {[
              { key: 'newListings', label: 'New listing matches', desc: 'Get notified when new properties match your preferences' },
              { key: 'inspection24h', label: 'Inspection reminders (24h)', desc: 'Reminder one day before your scheduled inspection' },
              { key: 'inspection1h', label: 'Inspection reminders (1h)', desc: 'Reminder one hour before your scheduled inspection' },
              { key: 'propaWhatsApp', label: 'Propa AI responses via WhatsApp', desc: 'Receive Propa chat responses on WhatsApp' },
              { key: 'weeklyGuides', label: 'Weekly neighborhood guides', desc: 'Curated guides about areas you follow' },
              { key: 'savedAreas', label: 'New verified listings in saved areas', desc: 'Alerts when new verified properties appear in your areas' },
            ].map((item, i) => (
              <div 
                key={item.key} 
                className="flex items-start justify-between gap-4 py-4 border-b border-beige last:border-0 animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div>
                  <p className="text-body font-medium text-navy">{item.label}</p>
                  <p className="text-caption text-subtle mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key as keyof typeof prev],
                    }))
                  }
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0',
                    notifications[item.key as keyof typeof notifications]
                      ? 'bg-navy shadow-sm'
                      : 'bg-divider'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300',
                      notifications[item.key as keyof typeof notifications]
                        ? 'translate-x-[22px]'
                        : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'Preferences' && (
          <div className="space-y-8 max-w-[600px]">
            <div>
              <h3 className="text-h3 text-navy mb-1">Property Preferences</h3>
              <p className="text-body text-subtle">Help us find better matches for you</p>
            </div>

            {/* Intent toggle */}
            <div className="animate-fade-up animate-fade-up-1">
              <label className="block text-nav font-medium text-navy mb-3">I want to</label>
              <div className="flex gap-2">
                {(['rent', 'buy', 'invest'] as const).map((intent) => (
                  <button
                    key={intent}
                    onClick={() => setPropertyIntent(intent)}
                    className={cn(
                      'px-6 py-2.5 rounded-badge text-body-sm font-medium capitalize transition-all duration-200',
                      propertyIntent === intent
                        ? 'bg-navy text-white shadow-sm'
                        : 'bg-beige text-subtle hover:text-navy hover:bg-navy/5 border border-divider'
                    )}
                  >
                    {intent}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget range */}
            <div className="animate-fade-up animate-fade-up-2">
              <label className="block text-nav font-medium text-navy mb-3">Budget range</label>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Min (₦)" defaultValue="1,000,000" />
                <Input placeholder="Max (₦)" defaultValue="100,000,000" />
              </div>
            </div>

            {/* Preferred areas */}
            <div className="animate-fade-up animate-fade-up-3">
              <label className="block text-nav font-medium text-navy mb-3">Preferred areas</label>
              <div className="flex flex-wrap gap-2">
                {preferredAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleArea(area)}
                    className={cn(
                      'px-4 py-2 rounded-badge text-body-sm font-medium transition-all duration-200',
                      selectedAreas.includes(area)
                        ? 'bg-navy text-white shadow-sm'
                        : 'bg-beige text-subtle border border-divider hover:bg-navy hover:text-white hover:border-navy'
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Bedrooms stepper */}
            <div className="animate-fade-up animate-fade-up-4">
              <label className="block text-nav font-medium text-navy mb-3">Minimum bedrooms</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
                  className="w-10 h-10 rounded-button border border-divider flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-all duration-200 text-h4"
                >
                  −
                </button>
                <span className="text-h3 text-navy w-8 text-center animate-count-up" key={bedrooms}>{bedrooms}</span>
                <button
                  onClick={() => setBedrooms(Math.min(10, bedrooms + 1))}
                  className="w-10 h-10 rounded-button border border-divider flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-all duration-200 text-h4"
                >
                  +
                </button>
              </div>
            </div>

            <Button variant="primary" className="group">
              Save Preferences <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'Account' && (
          <div className="space-y-8 max-w-[600px]">
            {/* Change password */}
            <div className="animate-fade-up animate-fade-up-1">
              <h3 className="text-h3 text-navy mb-4">Change Password</h3>
              <div className="space-y-5">
                <Input label="Current password" type="password" placeholder="Enter current password" />
                <Input label="New password" type="password" placeholder="Minimum 8 characters" />
                <Input label="Confirm new password" type="password" placeholder="Re-enter new password" />
                <Button variant="primary" className="group">
                  Update Password <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>

            {/* Sign out */}
            <div className="pt-6 border-t border-divider animate-fade-up animate-fade-up-2">
              <h3 className="text-h3 text-navy mb-2">Sign out all devices</h3>
              <p className="text-body text-subtle mb-4">
                This will sign you out from all devices where you are currently logged in.
              </p>
              <Button variant="secondary">Sign Out All Devices</Button>
            </div>

            {/* Danger zone */}
            <div className="pt-6 border-t border-divider animate-fade-up animate-fade-up-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-danger" strokeWidth={2} />
                <h3 className="text-h3 text-danger">Danger Zone</h3>
              </div>
              <p className="text-body text-subtle mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="danger">Delete Account</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
