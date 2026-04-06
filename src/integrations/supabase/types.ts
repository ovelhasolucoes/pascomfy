export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          company_id: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_program: {
        Row: {
          active: boolean
          code: string
          commission_pct: number
          company_id: string
          created_at: string
          id: string
        }
        Insert: {
          active?: boolean
          code: string
          commission_pct?: number
          company_id: string
          created_at?: string
          id?: string
        }
        Update: {
          active?: boolean
          code?: string
          commission_pct?: number
          company_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_program_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          referred_company_id: string
          reward_applied: boolean
          status: Database["public"]["Enums"]["referral_status"]
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          referred_company_id: string
          reward_applied?: boolean
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          referred_company_id?: string
          reward_applied?: boolean
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_program"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_referred_company_id_fkey"
            columns: ["referred_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_items: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_required: boolean
          template_id: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_required?: boolean
          template_id: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_required?: boolean
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active_users_count: number
          created_at: string
          custom_domain: string | null
          id: string
          logo_url: string | null
          name: string
          plan_id: string | null
          primary_color: string | null
          secondary_color: string | null
          settings: Json
          status: Database["public"]["Enums"]["company_status"]
          storage_used_mb: number
          subscription_id: string | null
          trial_until: string | null
        }
        Insert: {
          active_users_count?: number
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json
          status?: Database["public"]["Enums"]["company_status"]
          storage_used_mb?: number
          subscription_id?: string | null
          trial_until?: string | null
        }
        Update: {
          active_users_count?: number
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json
          status?: Database["public"]["Enums"]["company_status"]
          storage_used_mb?: number
          subscription_id?: string | null
          trial_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendance: {
        Row: {
          checkin_at: string | null
          company_id: string
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["attendance_status"]
          user_id: string
        }
        Insert: {
          checkin_at?: string | null
          company_id: string
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          user_id: string
        }
        Update: {
          checkin_at?: string | null
          company_id?: string
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklist_items: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          display_order: number
          event_checklist_id: string
          id: string
          is_required: boolean
          scope: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          event_checklist_id: string
          id?: string
          is_required?: boolean
          scope?: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          event_checklist_id?: string
          id?: string
          is_required?: boolean
          scope?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checklist_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_items_event_checklist_id_fkey"
            columns: ["event_checklist_id"]
            isOneToOne: false
            referencedRelation: "event_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklist_progress: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          event_checklist_item_id: string
          id: string
          status: Database["public"]["Enums"]["checklist_status"]
          user_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          event_checklist_item_id: string
          id?: string
          status?: Database["public"]["Enums"]["checklist_status"]
          user_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          event_checklist_item_id?: string
          id?: string
          status?: Database["public"]["Enums"]["checklist_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checklist_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_progress_event_checklist_item_id_fkey"
            columns: ["event_checklist_item_id"]
            isOneToOne: false
            referencedRelation: "event_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklists: {
        Row: {
          company_id: string
          created_at: string
          event_id: string
          event_team_id: string | null
          id: string
          name: string
          template_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          event_id: string
          event_team_id?: string | null
          id?: string
          name: string
          template_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          event_id?: string
          event_team_id?: string | null
          id?: string
          name?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklists_event_team_id_fkey"
            columns: ["event_team_id"]
            isOneToOne: false
            referencedRelation: "event_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      event_team_members: {
        Row: {
          company_id: string
          confirmed_at: string | null
          created_at: string
          event_team_id: string
          id: string
          role_description: string | null
          role_name: string | null
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Insert: {
          company_id: string
          confirmed_at?: string | null
          created_at?: string
          event_team_id: string
          id?: string
          role_description?: string | null
          role_name?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Update: {
          company_id?: string
          confirmed_at?: string | null
          created_at?: string
          event_team_id?: string
          id?: string
          role_description?: string | null
          role_name?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_team_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_team_members_event_team_id_fkey"
            columns: ["event_team_id"]
            isOneToOne: false
            referencedRelation: "event_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_teams: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          display_order: number
          event_id: string
          id: string
          name: string
          template_id: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          event_id: string
          id?: string
          name: string
          template_id?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          event_id?: string
          id?: string
          name?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_teams_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "team_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          event_type_id: string | null
          id: string
          location: string | null
          start_date: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          event_type_id?: string | null
          id?: string
          location?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_type_id?: string | null
          id?: string
          location?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      global_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip_address: string | null
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invite_status"]
          token: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          email: string
          expires_at: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          allows_custom_domain: boolean
          allows_whitelabel: boolean
          created_at: string
          description: string | null
          id: string
          max_storage_mb: number
          max_uploads: number
          max_users: number
          name: string
          price_monthly: number
        }
        Insert: {
          allows_custom_domain?: boolean
          allows_whitelabel?: boolean
          created_at?: string
          description?: string | null
          id?: string
          max_storage_mb?: number
          max_uploads?: number
          max_users?: number
          name: string
          price_monthly?: number
        }
        Update: {
          allows_custom_domain?: boolean
          allows_whitelabel?: boolean
          created_at?: string
          description?: string | null
          id?: string
          max_storage_mb?: number
          max_uploads?: number
          max_users?: number
          name?: string
          price_monthly?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability: Json
          avatar_url: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          last_access_at: string | null
          name: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          phone: string | null
          reliability_score: number
          settings: Json
          status: Database["public"]["Enums"]["user_status"]
        }
        Insert: {
          availability?: Json
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id: string
          last_access_at?: string | null
          name: string
          permission_level?: Database["public"]["Enums"]["permission_level"]
          phone?: string | null
          reliability_score?: number
          settings?: Json
          status?: Database["public"]["Enums"]["user_status"]
        }
        Update: {
          availability?: Json
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          last_access_at?: string | null
          name?: string
          permission_level?: Database["public"]["Enums"]["permission_level"]
          phone?: string | null
          reliability_score?: number
          settings?: Json
          status?: Database["public"]["Enums"]["user_status"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          company_id: string
          created_at: string
          ends_at: string | null
          external_id: string | null
          gateway: string | null
          id: string
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
        }
        Insert: {
          company_id: string
          created_at?: string
          ends_at?: string | null
          external_id?: string | null
          gateway?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Update: {
          company_id?: string
          created_at?: string
          ends_at?: string | null
          external_id?: string | null
          gateway?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_templates: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          allowed: boolean
          company_id: string
          created_at: string
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          allowed?: boolean
          company_id: string
          created_at?: string
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          company_id?: string
          created_at?: string
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_permission: {
        Args: { _permission_name: string; _user_id: string }
        Returns: boolean
      }
      get_company_limits: { Args: { _company_id: string }; Returns: Json }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "colaborador" | "admin" | "super_admin"
      attendance_status: "presente" | "ausente"
      checklist_status: "pendente" | "concluido"
      company_status: "ativa" | "suspensa" | "cancelada"
      event_status: "ativo" | "cancelado"
      invite_status: "pendente" | "aceito" | "expirado"
      member_status: "pendente" | "confirmado" | "ausente" | "substituido"
      permission_level: "basico" | "avancado"
      referral_status: "pendente" | "convertido"
      subscription_status: "ativo" | "cancelado" | "trial" | "atrasado"
      ticket_status: "aberto" | "respondido" | "fechado"
      user_status: "ativo" | "inativo" | "bloqueado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["colaborador", "admin", "super_admin"],
      attendance_status: ["presente", "ausente"],
      checklist_status: ["pendente", "concluido"],
      company_status: ["ativa", "suspensa", "cancelada"],
      event_status: ["ativo", "cancelado"],
      invite_status: ["pendente", "aceito", "expirado"],
      member_status: ["pendente", "confirmado", "ausente", "substituido"],
      permission_level: ["basico", "avancado"],
      referral_status: ["pendente", "convertido"],
      subscription_status: ["ativo", "cancelado", "trial", "atrasado"],
      ticket_status: ["aberto", "respondido", "fechado"],
      user_status: ["ativo", "inativo", "bloqueado"],
    },
  },
} as const
