import { getPatients } from '../actions/patient';
import TimelineClient from './TimelineClient';

export const dynamic = 'force-dynamic';

export default async function TimelinePage() {
  const patients = await getPatients();
  return <TimelineClient initialPatients={patients} />;
}
