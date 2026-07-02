"use client"

import { motion, useReducedMotion } from "framer-motion"

const STATS = [
  { value: "11 nines", label: "Durability" },
  { value: "$4/mo",    label: "Starting from" },
  { value: "12–48 hr", label: "Restore time" },
  { value: "50 TB",    label: "Max storage" },
  { value: "$0",       label: "Hidden fees" },
]

export function StatsStrip() {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      viewport={{ once: true }}
      className="relative z-10 border-y border-border/40 bg-zinc-950/60 backdrop-blur-sm dark:bg-zinc-950/60 bg-zinc-100/60"
    >
      <div className="mx-auto max-w-5xl px-6 py-7">
        <dl className="flex flex-wrap items-center justify-center divide-y divide-border/30 md:divide-y-0 md:divide-x md:divide-border/40">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex w-1/2 flex-col items-center gap-0.5 py-4 text-center md:w-auto md:px-8 md:py-0"
            >
              <dt className="font-mono text-xl font-bold tabular-nums tracking-tight text-foreground">
                {stat.value}
              </dt>
              <dd className="text-xs text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </motion.div>
  )
}
