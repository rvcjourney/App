# Enable real-time updates for bookings and notifications

For **instant updates** when a student books a session or when a teacher goes live, Supabase Realtime must be enabled for the `bookings` and `notifications` tables.

## Steps (Supabase Dashboard)

1. Go to **Database** → **Replication** (or **Publications**).
2. Open the `supabase_realtime` publication.
3. Add the following tables to the publication:
   - `bookings`
   - `notifications`
4. Save.

If Realtime is not enabled for these tables, the app will still work but updates may not appear until you pull to refresh or reopen the screen. Pull-to-refresh is available on both dashboards as a fallback.
