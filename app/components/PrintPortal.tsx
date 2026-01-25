'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function PrintPortal({ children }: { children: React.ReactNode }) {
  const [element, setElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let portalRoot = document.getElementById('print-portal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'print-portal-root';
      document.body.appendChild(portalRoot);
    }
    setElement(portalRoot);
  }, []);

  if (!element) return null;

  return createPortal(children, element);
}
