import { Suspense } from 'react';
import NewTicketForm from './NewTicketForm';

export default function NewTicketPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">در حال بارگذاری...</div>}>
      <NewTicketForm />
    </Suspense>
  );
}
