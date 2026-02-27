import { Suspense } from 'react';
import NewTicketForm from './NewTicketForm';
import Loading from '@/app/loading';

export default function NewTicketPage() {
  return (
    <Suspense fallback={<Loading></Loading>}>
      <NewTicketForm />
    </Suspense>
  );
}
