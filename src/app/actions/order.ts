'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function logEvent(
  orderId: string,
  timestamp: Date,
  assessment?: { rr?: number; urineOutput?: number; reflex?: string }
) {
  await prisma.eventLog.create({
    data: {
      orderId,
      doneAt: timestamp,
      rr: assessment?.rr,
      urineOutput: assessment?.urineOutput,
      reflex: assessment?.reflex,
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
