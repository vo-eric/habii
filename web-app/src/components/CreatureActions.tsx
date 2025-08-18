'use client';

import { useCreature } from '@/lib/database/hooks/useCreature';
import { Button } from '@chakra-ui/react';

export default function CreatureActions() {
  const { feedCreature, playWithCreature, restCreature } = useCreature();

  return (
    <div>
      <Button onClick={() => feedCreature()}>Feed</Button>
      <Button onClick={() => playWithCreature()}>Play</Button>
      <Button onClick={() => restCreature()}>Sleep</Button>
    </div>
  );
}
