import React, { useEffect, useState } from 'react';
import { Confetti } from './Confetti';
import { useAppStore } from '@/store/useAppStore';

export function ConfettiHost() {
  const tick = useAppStore((s) => s.confettiTick);
  const [active, setActive] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (tick === 0) return;
    setActive(true);
    setVersion((v) => v + 1);
  }, [tick]);

  return <Confetti key={version} active={active} onComplete={() => setActive(false)} count={48} />;
}
