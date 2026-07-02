"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}

const fade: Variants = {
  hidden: { opacity: 0, filter: "blur(8px)", y: 16 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { type: "spring" as const, bounce: 0.2, duration: 1 },
  },
}

export function HeroSection() {
  const prefersReduced = useReducedMotion()
  const shouldAnimate = !prefersReduced

  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-6 py-24">
      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.038]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(96 165 250) 1.5px, transparent 1.5px)",
          backgroundSize: "30px 30px",
        }}
      />
      {/* Glow orb — top left */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-48 -top-24 h-[640px] w-[640px] rounded-full bg-blue-500/[0.07] blur-[110px]"
      />
      {/* Glow orb — bottom right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-48 h-[500px] w-[500px] rounded-full bg-blue-400/[0.05] blur-[120px]"
      />
      {/* Bottom fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background to-transparent"
      />

      <motion.div
        className="relative z-10 mx-auto max-w-3xl text-center"
        variants={shouldAnimate ? container : undefined}
        initial={shouldAnimate ? "hidden" : undefined}
        animate={shouldAnimate ? "show" : undefined}
      >
        {/* Badge */}
        <motion.div variants={shouldAnimate ? fade : undefined} className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/5 px-3.5 py-1.5 text-xs text-blue-400 backdrop-blur-sm">
            <Lock size={10} />
            Enterprise-grade durability, consumer-friendly pricing
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={shouldAnimate ? fade : undefined}
          className="mb-6 bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-5xl font-bold leading-[1.06] tracking-tight text-transparent sm:text-6xl lg:text-[4.5rem]"
        >
          Archive terabytes.
          <br />
          Pay a flat fee.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={shouldAnimate ? fade : undefined}
          className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Store terabytes of photos, videos, and documents without watching a
          cost dashboard. One predictable monthly price — no surprise bills,
          no hidden fees, ever.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={shouldAnimate ? fade : undefined}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            size="lg"
            className="cursor-pointer gap-2"
            render={<Link href="/sign-up" />}
          >
            Start for free
            <ArrowRight size={14} />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="cursor-pointer border-border/60 text-muted-foreground hover:text-foreground"
            render={<Link href="#pricing" />}
          >
            See pricing
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}
