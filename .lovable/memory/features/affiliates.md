---
name: Affiliate/Referral System
description: Multi-tenant affiliate program with signup, referral tracking, and auto-rewards on payment
type: feature
---
- Tables: affiliate_program (reward_type enum, reward_value, code unique), affiliate_referrals (unique referred_company_id), affiliate_rewards
- reward_type enum: dias_gratis, desconto, upgrade
- Public signup at /signup?ref=CODE creates company + trial subscription + links referral
- handle_new_user trigger creates company when company_name metadata provided (no invite)
- Admin panel at /admin/referrals shows code, share link, referrals, rewards
- Webhooks (asaas, mercadopago) auto-convert referrals on payment and apply dias_gratis rewards
- desconto/upgrade rewards require manual super admin action
- SuperAdminAffiliates shows all programs with toggle active, rewards count
