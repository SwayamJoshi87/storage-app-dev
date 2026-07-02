"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import { Infinity, DollarSign, DownloadCloud, ShieldCheck, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

type Feature = {
  icon: React.ElementType
  tag: string
  title: string
  description: string
  span: string
  accent: string
  large?: boolean
}

const FEATURES: Feature[] = [
  {
    icon: Infinity,
    tag: "Durability",
    title: "Built to last forever",
    description:
      "Your files are stored with 99.999999999% durability — that's less than one file lost per trillion stored. Designed to survive hardware failures, natural disasters, and decades of time.",
    span: "md:col-span-2 lg:col-span-4",
    accent: "bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/20",
    large: true,
  },
  {
    icon: DollarSign,
    tag: "Pricing",
    title: "One price. No surprises.",
    description: "Pay once a month and forget about it. No usage spikes, no overage charges, no fees you didn't see coming.",
    span: "lg:col-span-2",
    accent: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20",
  },
  {
    icon: DownloadCloud,
    tag: "Restores",
    title: "Get your files back, simply",
    description: "Request access to any archived file from your dashboard. Get an email when it's ready to download — typically within a day.",
    span: "lg:col-span-2",
    accent: "bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/20",
  },
  {
    icon: ShieldCheck,
    tag: "Security",
    title: "Your files, only yours",
    description: "Every upload and download uses a secure, time-limited link. Nothing is accessible without your account. Your data is encrypted at rest and in transit.",
    span: "lg:col-span-2",
    accent: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20",
  },
  {
    icon: Layers,
    tag: "Storage",
    title: "Archive and instant access",
    description: "Two storage modes in one platform. Deep archive for long-term storage at the lowest possible cost. Instant access for files you need on demand.",
    span: "md:col-span-2 lg:col-span-2",
    accent: "bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/20",
  },
]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const card: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, bounce: 0.15, duration: 0.65 },
  },
}

export function FeaturesBento() {
  const prefersReduced = useReducedMotion()
  const shouldAnimate = !prefersReduced

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mb-12 text-center"
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.45, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">
            Why Archivault
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Built for the long haul
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6"
          variants={shouldAnimate ? container : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          whileInView={shouldAnimate ? "show" : undefined}
          viewport={{ once: true, margin: "-80px" }}
        >
          {FEATURES.map(({ icon: Icon, tag, title, description, span, accent, large }) => (
            <motion.div
              key={title}
              variants={shouldAnimate ? card : undefined}
              whileHover={shouldAnimate ? { y: -2, transition: { duration: 0.18, ease: "easeOut" } } : undefined}
              className={cn(
                "group relative flex cursor-default flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors duration-200 hover:border-zinc-700",
                span,
              )}
            >
              {/* Hover glow blob */}
              <div
                aria-hidden
                className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-blue-400/[0.04] blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />

              {/* Icon */}
              <div className={cn("relative mb-4 inline-flex rounded-lg p-2", accent)}>
                <Icon size={14} />
              </div>

              {/* Tag */}
              <span className="mb-1 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
                {tag}
              </span>

              {/* Title */}
              <p className={cn("font-semibold", large ? "mb-2 text-base" : "mb-1.5 text-sm")}>
                {title}
              </p>

              {/* Description */}
              <p className={cn("leading-relaxed text-muted-foreground", large ? "text-sm" : "text-xs")}>
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
