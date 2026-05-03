'use client';

import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
  type HTMLMotionProps,
} from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export const easeSmooth: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 52 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.76, ease: easeSmooth },
  },
};

export function MotionSection({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      data-section
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1, margin: '0px 0px -12% 0px' }}
      variants={sectionReveal}
    >
      {children}
    </motion.section>
  );
}

export const heroContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

export const heroItem: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: easeSmooth },
  },
};

export const heroStatsGrid: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.075, delayChildren: 0.04 },
  },
};

export const staggerCard: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.055,
      duration: 0.55,
      ease: easeSmooth,
    },
  }),
};

/** Gradient headline — scales & glows slightly on hover */
export function HoverGlowTitle({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <span className={className}>{children}</span>;
  }
  return (
    <motion.span
      className={`inline-block origin-left ${className}`}
      whileHover={{
        scale: 1.025,
        filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.42))',
      }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
    >
      {children}
    </motion.span>
  );
}

/** Cycles phrases with a typewriter reveal once the line enters view */
export function TypewriterCycle({
  phrases,
  className = '',
  typingMs = 38,
  pauseMs = 2600,
}: {
  phrases: readonly string[];
  className?: string;
  typingMs?: number;
  pauseMs?: number;
}) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(wrapRef, { once: true, margin: '-12% 0px' });
  const reduce = useReducedMotion();
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (!isInView || phrases.length === 0 || reduce) return;
    const phrase = phrases[phraseIdx % phrases.length];
    let charIndex = 0;
    let cancelled = false;
    const timers: number[] = [];

    const tick = () => {
      if (cancelled) return;
      charIndex += 1;
      setDisplay(phrase.slice(0, charIndex));
      if (charIndex < phrase.length) {
        timers.push(window.setTimeout(tick, typingMs + Math.random() * 22));
      } else {
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return;
            setPhraseIdx((i) => (i + 1) % phrases.length);
            setDisplay('');
          }, pauseMs)
        );
      }
    };

    timers.push(window.setTimeout(tick, phraseIdx === 0 ? 320 : 140));

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isInView, phraseIdx, phrases, typingMs, pauseMs, reduce]);

  if (reduce) {
    return <span className={className}>{phrases[0] ?? ''}</span>;
  }

  return (
    <span ref={wrapRef} className={`inline-flex items-center gap-1 ${className}`}>
      <span className="min-h-[1.35em] text-left" aria-live="polite">
        {display}
      </span>
      <motion.span
        className="inline-block h-[1.1em] w-[2px] shrink-0 rounded-full bg-cyan-400/90"
        animate={{ opacity: [1, 0.15, 1] }}
        transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />
    </span>
  );
}

export function MotionFooter(props: HTMLMotionProps<'footer'>) {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.65, ease: easeSmooth }}
      {...props}
    />
  );
}
