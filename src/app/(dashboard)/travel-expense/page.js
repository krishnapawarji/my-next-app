import TravelExpenseClient from '@/components/TravelExpenseClient';
import { getTravelExpenses, getSessionUser } from '@/app/actions';

export const metadata = {
  title: 'Travel Expenses | Aura HRMS',
};

export default async function TravelExpensePage() {
  const records = await getTravelExpenses();
  const user = await getSessionUser();

  return (
    <div className="max-w-6xl mx-auto">
      <TravelExpenseClient records={records} user={user} />
    </div>
  );
}
