
SELECT cron.schedule(
  'social-publish-scheduled',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://cchovdurprjtefisautg.supabase.co/functions/v1/social-publish',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaG92ZHVycHJqdGVmaXNhdXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODUyODYsImV4cCI6MjA5MTA2MTI4Nn0.bjXrVVNkUN88pq9piHFD7itpdjm2EcD5q7S7sFx0g8g"}'::jsonb,
    body:='{"scheduled_cron": true}'::jsonb
  ) AS request_id;
  $$
);
