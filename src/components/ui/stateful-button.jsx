// Adapted from Aceternity UI's stateful-button (Manu Arora).
// https://ui.aceternity.com/registry/stateful-button-demo.json
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, LoaderCircle } from 'lucide-react';

export function StatefulButton({ children, href, onClick }) {
  const [state, setState] = useState('idle');
  const timers = useRef([]);
  const reduced = useReducedMotion();
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  function activate(event) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    timers.current.forEach(clearTimeout);
    // Native link navigation opens WhatsApp immediately. This feedback indicates
    // the link activation only; it does not claim that a message was sent.
    setState('loading');
    timers.current = [setTimeout(() => setState('done'), 450), setTimeout(() => setState('idle'), 2400)];
  }
  const Icon = state === 'loading' ? LoaderCircle : state === 'done' ? Check : ArrowUpRight;
  return <motion.a href={href} target="_blank" rel="noopener noreferrer" className="button button-primary hero-stateful-button" onClick={activate} whileTap={reduced ? undefined : { scale: 0.97 }}>
    <span>{children}</span>
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={state} className="stateful-icon" aria-hidden="true" initial={{ opacity: 0, scale: reduced ? 1 : 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduced ? 1 : 0.5 }} transition={{ duration: reduced ? 0 : 0.15 }}><Icon size={18} className={state === 'loading' ? 'stateful-spinner' : undefined} /></motion.span>
    </AnimatePresence>
  </motion.a>;
}
