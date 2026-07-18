'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Runs on a schedule (check-reminders cron, every 5 min) instead of on every
// read — deleteMany() was previously inline in getPatients(), doubling every
// page load's DB round-trip for a cleanup that doesn't need to be that fresh.
export async function purgeExpiredPatients() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.patient.deleteMany({
    where: { createdAt: { lt: yesterday } }
  });
}

export async function getPatients() {
  return await prisma.patient.findMany({
    include: {
      orders: {
        include: {
          eventLogs: {
            orderBy: { doneAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addPatient(data: {
  bedNumber: string;
  nickname: string;
  dx?: string;
  initialNote?: string;
  orders: {
    type: string;
    name: string;
    intervalMinutes: number | null;
    startTime: Date;
  }[];
}) {
  const patient = await prisma.patient.create({
    data: {
      bedNumber: data.bedNumber,
      nickname: data.nickname,
      dx: data.dx,
      initialNote: data.initialNote,
      orders: {
        create: data.orders.map(o => ({
          type: o.type,
          name: o.name,
          intervalMinutes: o.intervalMinutes,
          startTime: o.startTime,
        })),
      },
    },
  });
  
  revalidatePath('/');
  revalidatePath('/timeline');
  return patient;
}

export async function dischargePatient(id: string) {
  await prisma.patient.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/timeline');
}
