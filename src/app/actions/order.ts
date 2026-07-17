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
  revalidatePath(`/patient/[id]/report`);
}

export async function discontinueOrder(orderId: string) {
  await prisma.order.delete({
    where: { id: orderId },
  });
  
  revalidatePath('/');
  revalidatePath('/timeline');
  revalidatePath(`/patient/[id]/report`);
}
