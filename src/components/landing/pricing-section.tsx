"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PLANS = [
  { label: "Free",     price: "$0",   period: "",    archive: "25 GB",  instant: "—",       restores: 1,  popular: false },
  { label: "Starter",  price: "$4",   period: "/mo", archive: "500 GB", instant: "—",       restores: 3,  popular: false },
  { label: "Personal", price: "$10",  period: "/mo", archive: "2 TB",   instant: "50 GB",   restores: 5,  popular: true  },
  { label: "Creator",  price: "$30",  period: "/mo", archive: "10 TB",  instant: "200 GB",  restores: 15, popular: false },
  { label: "Power",    price: "$100", period: "/mo", archive: "50 TB",  instant: "500 GB",  restores: 40, popular: false },
]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const card: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, bounce: 0.18, duration: 0.6 },
  },
}

export function PricingSection() {
  const prefersReduced = useReducedMotion()
  const shouldAnimate = !prefersReduced

  return (
    <section id="pricing" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mb-12 text-center"
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.45, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">
            Pricing
          </p>
          <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Simple, honest pricing
          </h2>
          <p className="text-sm text-muted-foreground">
            Pay once a month. No surprises. Ever.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
          variants={shouldAnimate ? container : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          whileInView={shouldAnimate ? "show" : undefined}
          viewport={{ once: true, margin: "-80px" }}
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.label}
              variants={shouldAnimate ? card : undefined}
              whileHover={
                shouldAnimate
                  ? { y: -3, transition: { duration: 0.18, ease: "easeOut" } }
                  : undefined
              }
              className={cn(
                "relative flex flex-col rounded-xl border p-4 transition-colors duration-200",
                plan.popular
                  ? "border-blue-400/40 bg-blue-400/[0.04] shadow-[0_0_45px_-15px_rgba(96,165,250,0.25)]"
                  : "border-border bg-card hover:border-zinc-700",
              )}
            >
              {plan.popular && (
                <span className="mb-3 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-blue-400">
                  Most popular
                </span>
              )}

              <p className="mb-1 text-sm font-semibold">{plan.label}</p>

              <div className="mb-5 flex items-baseline gap-0.5">
                <span className="font-mono text-2xl font-bold tabular-nums">
                  {plan.price}
                </span>
                <span className="text-xs text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mb-5 flex-1 space-y-2">
                {[
                  `${plan.archive} archive`,
                  ...(plan.instant !== "—" ? [`${plan.instant} instant access`] : []),
                  `${plan.restores} restore${plan.restores !== 1 ? "s" : ""}/mo`,
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Check size={10} className="shrink-0 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                size="sm"
                variant={plan.popular ? "default" : "outline"}
                className="w-full cursor-pointer"
                render={<Link href="/sign-up" />}
              >
                Get started
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
