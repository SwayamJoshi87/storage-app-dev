import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Snowflake } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { HeroSection } from '@/components/landing/hero-section'
import { StatsStrip } from '@/components/landing/stats-strip'
import { FeaturesBento } from '@/components/landing/features-bento'
import { PricingSection } from '@/components/landing/pricing-section'

export default async function LandingPage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background text-foreground">

      <LandingNavbar />

      {/* Hero */}
      <HeroSection />

      {/* Stats */}
      <StatsStrip />

      {/* Features bento */}
      <FeaturesBento />

      {/* Pricing */}
      <PricingSection />

      <Separator className="opacity-30" />

      {/* Footer */}
      <footer className="py-8 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/40">
          <Snowflake size={10} className="text-blue-400/40" />
          Archivault — Archive terabytes. Pay a flat fee.
        </div>
      </footer>
    </div>
  )
}
