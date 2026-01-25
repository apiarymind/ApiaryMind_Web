import { getHivesWithOldQueens } from '@/app/actions/get-old-queens';
import QueensListClient from './QueensListClient';

export default async function QueensPage() {
  const { data: hives, error } = await getHivesWithOldQueens();

  if (error) {
    console.error('Error fetching old queens:', error);
  }

  return <QueensListClient initialHives={hives || []} />;
}
