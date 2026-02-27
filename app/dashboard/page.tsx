'use server';

import { redirect } from 'next/navigation';
import DashboardClient from '@/components/DashboardClient';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserCourses } from '@/lib/data/courses';
import { getUserFiles } from '@/lib/data/files';
import { getUserPurchases, getUserTransactions } from '@/lib/data/transactions';
import { getUserProfile } from '@/lib/data/users';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // if user had not logged in redirect them
  if (!session?.user?.id) {
    redirect('/login?redirectedFrom=/dashboard');
  }

  const user = session.user;
  // check profile existance and email verification
  if (!user) {
    redirect('/login?redirectedFrom=/dashboard');
  }
  if (!user.email_confirmed_at) {
    redirect('/verify-email');
  }

  const userId = user.id;

  const [purchases, transactions, courses, files, profile] = await Promise.all([
    getUserPurchases(supabase, userId),
    getUserTransactions(supabase, userId),
    getUserCourses(supabase, userId),
    getUserFiles(supabase, userId),
    getUserProfile(supabase, userId),
  ]);

  if (!profile) {
    redirect('/login?redirectedFrom=/dashboard');
  }

  return (
    <DashboardClient
      user={profile}
      purchases={purchases}
      transactions={transactions}
      courses={courses}
      files={files}
    />
  );
}
