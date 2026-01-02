import { SupabaseClient } from '@supabase/supabase-js';
import { Ticket, TicketMessage, User } from '@/lib/api';

export async function getUserTickets(
  client: SupabaseClient,
  userId: string,
): Promise<Ticket[]> {
  const { data: tickets, error } = await client
    .from<Ticket>('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return tickets || [];
}

export async function getTicketById(
  client: SupabaseClient,
  ticketId: string,
): Promise<Ticket | null> {
  const { data: ticket, error } = await client
    .from<Ticket>('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return ticket || null;
}

export async function getTicketMessages(
  client: SupabaseClient,
  ticketId: string,
): Promise<TicketMessage[]> {
  const { data: messages, error } = await client
    .from<TicketMessage>('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return messages || [];
}

export async function getTicketWithRelations(
  client: SupabaseClient,
  ticketId: string,
): Promise<Ticket | null> {
  const ticket = await getTicketById(client, ticketId);
  if (!ticket) {
    return null;
  }

  const baseUserIds = [
    ticket.user_id,
    ticket.assigned_to,
  ]
    .filter((id): id is string => Boolean(id));

  const { data: messages, error: messagesError } = await client
    .from<TicketMessage>('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw messagesError;
  }

  const messageUserIds = [
    ...new Set(
      (messages || [])
        .map((message) => message.user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const allUserIds = [
    ...new Set([...baseUserIds, ...messageUserIds]),
  ];

  const usersMap = new Map<string, User>();
  if (allUserIds.length > 0) {
    const { data: users, error: usersError } = await client
      .from<User>('users')
      .select('id, email, first_name, last_name, role')
      .in('id', allUserIds);
    if (usersError) {
      throw usersError;
    }
    users?.forEach((user) => usersMap.set(user.id, user));
  }

  return {
    ...ticket,
    user: ticket.user_id ? usersMap.get(ticket.user_id) || null : null,
    assigned_to: ticket.assigned_to ? usersMap.get(ticket.assigned_to) || null : null,
    messages: (messages || []).map((message) => ({
      ...message,
      user: message.user_id ? usersMap.get(message.user_id) || null : null,
    })),
  };
}

