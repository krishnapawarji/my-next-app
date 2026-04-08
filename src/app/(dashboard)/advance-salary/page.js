import { getSessionUser, getAdvanceSalaryRecords } from '@/app/actions';
import AdvanceSalaryClient from '@/components/AdvanceSalaryClient';
import { redirect } from 'next/navigation';

export default async function AdvanceSalaryPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const records = await getAdvanceSalaryRecords();

  return <AdvanceSalaryClient user={user} initialRecords={records} />;
}
