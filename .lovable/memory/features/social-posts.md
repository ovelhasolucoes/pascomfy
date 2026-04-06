---
name: Social Posts (Meta Integration)
description: Module for publishing to Facebook/Instagram via Meta Graph API v21.0, per-company Meta App, OAuth, scheduling
type: feature
---
- Tables: social_accounts (tokens, page_id, ig_id), social_posts (caption, media, status, scheduling)
- View: social_accounts_safe (hides tokens for frontend)
- Edge Functions: meta-oauth (OAuth callback), social-publish (publish/schedule)
- Each company has its own Meta App (app_id + app_secret)
- Facebook scheduling: native scheduled_publish_time
- Instagram scheduling: pg_cron fallback (IG API doesn't support native scheduling)
- Temp media in social-temp bucket, cleaned after publish
- Routes: /social/posts, /social/calendar, /social/accounts
- Sidebar: Social section visible for admin
