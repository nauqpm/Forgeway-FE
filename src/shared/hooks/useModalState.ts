import { useState } from "react";

export function useModalState<K extends string>() {
  const [open, setOpen] = useState<Partial<Record<K, boolean>>>({});

  const show = (k: K) => setOpen((prev) => ({ ...prev, [k]: true }));
  const hide = (k: K) => setOpen((prev) => ({ ...prev, [k]: false }));
  const toggle = (k: K) => setOpen((prev) => ({ ...prev, [k]: !prev[k] }));
  const isOpen = (k: K) => Boolean(open[k]);

  return { open, show, hide, toggle, isOpen };
}
