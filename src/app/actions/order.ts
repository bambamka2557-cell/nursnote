'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function logEvent(orderId: string, timestamp: Date) {
  await prisma.eventLog.create({
    data: {
      orderId,
      doneAt: timestamp,
    },
  });
  
  revalidatePath('/');
  revalidatePath('/timeline');
}
