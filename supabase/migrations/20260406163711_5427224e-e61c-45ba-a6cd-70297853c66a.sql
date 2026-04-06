SELECT cron.schedule(
  'schedule-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://cchovdurprjtefisautg.supabase.co/functions/v1/schedule-reminders',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaG92ZHVycHJqdGVmaXNhdXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODUyODYsImV4cCI6MjA5MTA2MTI4Nn0.bjXrVVNkUN88pq9piHFD7itpdjm2EcD5q7S7sFx0g8g'
    ),
    body:='{"scheduled": true}'::jsonb
  ) AS request_id;
  $$
);