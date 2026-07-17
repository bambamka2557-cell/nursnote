import { addMinutes } from 'date-fns';

// One order instance that is due now (its next-due time has passed and it
// hasn't been marked done since). Mirrors the next-due computation in
// timeline/page.tsx: next due = (last doneAt, or startTime if never done) +
// intervalMinutes. `key` is stable per due-instance so a reminder fires once
// per instance; marking the order done shifts the next-due time and produces a
// new key, so the following interval can alert again.
export type DueOrder = {
  key: string;
  orderId: string;
  bedNumber: string;
  nickname: string;
  name: string;
  dueTime: Date;
};

export function computeDueOrders(patients: any[], now: Date = new Date()): DueOrder[] {
  const due: DueOrder[] = [];
  for (const patient of patients ?? []) {
    for (const order of patient.orders ?? []) {
      if (!order.intervalMinutes) continue; // one-off orders don't recur
      const lastEvent = order.eventLogs?.[0];
      const base = lastEvent ? new Date(lastEvent.doneAt) : new Date(order.startTime);
      const dueTime = addMinutes(base, order.intervalMinutes);
      if (now.getTime() >= dueTime.getTime()) {
        due.push({
          key: `${order.id}@${dueTime.getTime()}`,
          orderId: order.id,
          bedNumber: patient.bedNumber,
          nickname: patient.nickname,
          name: order.name,
          dueTime,
        });
      }
    }
  }
  return due;
}

// Pull the due-instance timestamp back out of a key ("orderId@<ms>") so old
// fired-keys can be pruned. Returns 0 if the key is malformed.
export function dueMsFromKey(key: string): number {
  const at = key.lastIndexOf('@');
  if (at === -1) return 0;
  const ms = Number(key.slice(at + 1));
  return Number.isFinite(ms) ? ms : 0;
}
