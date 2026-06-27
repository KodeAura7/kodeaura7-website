import { query } from '../database/pool.js';

export async function getStats() {
  const [contacts, subscribers, users, latestContacts, latestSubscribers] = await Promise.all([
    query('SELECT COUNT(*) FROM contact_messages WHERE deleted_at IS NULL'),
    query('SELECT COUNT(*) FROM newsletter_subscribers WHERE deleted_at IS NULL'),
    query("SELECT COUNT(*) FROM admin_users WHERE status = 'active'"),
    query(
      `SELECT id, name, email, service, created_at
       FROM contact_messages WHERE deleted_at IS NULL
       ORDER BY created_at DESC LIMIT 5`
    ),
    query(
      `SELECT id, email, subscribed_at
       FROM newsletter_subscribers WHERE deleted_at IS NULL
       ORDER BY subscribed_at DESC LIMIT 5`
    )
  ]);

  return {
    totals: {
      contacts: parseInt(contacts.rows[0].count),
      subscribers: parseInt(subscribers.rows[0].count),
      users: parseInt(users.rows[0].count)
    },
    latestContacts: latestContacts.rows,
    latestSubscribers: latestSubscribers.rows
  };
}
