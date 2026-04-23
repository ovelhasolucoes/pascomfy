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
          company_id: string
          created_at: string
          id: string
          reward_type: Database["public"]["Enums"]["reward_type"]
          reward_value: number
        }
        Insert: {
          active?: boolean
          code: string
          company_id: string
          created_at?: string
          id?: string
          reward_type?: Database["public"]["Enums"]["reward_type"]
          reward_value?: number
        }
        Update: {
          active?: boolean
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          reward_type?: Database["public"]["Enums"]["reward_type"]
          reward_value?: number
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
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_rewards: {
        Row: {
          affiliate_company_id: string
          applied: boolean
          applied_at: string | null
          created_at: string
          id: string
          referral_id: string
          reward_type: Database["public"]["Enums"]["reward_type"]
          reward_value: number
        }
        Insert: {
          affiliate_company_id: string
          applied?: boolean
          applied_at?: string | null
          created_at?: string
          id?: string
          referral_id: string
          reward_type: Database["public"]["Enums"]["reward_type"]
          reward_value?: number
        }
        Update: {
          affiliate_company_id?: string
          applied?: boolean
          applied_at?: string | null
          created_at?: string
          id?: string
          referral_id?: string
          reward_type?: Database["public"]["Enums"]["reward_type"]
          reward_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_rewards_affiliate_company_id_fkey"
            columns: ["affiliate_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          automation_id: string | null
          channel: Database["public"]["Enums"]["automation_channel"]
          company_id: string
          created_at: string
          gateway_response: string | null
          id: string
          message: string
          queue_item_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          automation_id?: string | null
          channel: Database["public"]["Enums"]["automation_channel"]
          company_id: string
          created_at?: string
          gateway_response?: string | null
          id?: string
          message: string
          queue_item_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          automation_id?: string | null
          channel?: Database["public"]["Enums"]["automation_channel"]
          company_id?: string
          created_at?: string
          gateway_response?: string | null
          id?: string
          message?: string
          queue_item_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "automation_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_queue: {
        Row: {
          attempts: number
          automation_id: string | null
          channel: Database["public"]["Enums"]["automation_channel"]
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          message: string
          metadata: Json
          processed_at: string | null
          status: Database["public"]["Enums"]["queue_status"]
          title: string
          user_id: string
        }
        Insert: {
          attempts?: number
          automation_id?: string | null
          channel: Database["public"]["Enums"]["automation_channel"]
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json
          processed_at?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
          title: string
          user_id: string
        }
        Update: {
          attempts?: number
          automation_id?: string | null
          channel?: Database["public"]["Enums"]["automation_channel"]
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json
          processed_at?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_queue_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          active: boolean
          channel: Database["public"]["Enums"]["automation_channel"]
          company_id: string
          config_json: Json
          created_at: string
          id: string
          message_template: string
          name: string
          title_template: string
          trigger_event:
            | Database["public"]["Enums"]["automation_trigger_type"]
            | null
          type: string
        }
        Insert: {
          active?: boolean
          channel?: Database["public"]["Enums"]["automation_channel"]
          company_id: string
          config_json?: Json
          created_at?: string
          id?: string
          message_template: string
          name: string
          title_template: string
          trigger_event?:
            | Database["public"]["Enums"]["automation_trigger_type"]
            | null
          type?: string
        }
        Update: {
          active?: boolean
          channel?: Database["public"]["Enums"]["automation_channel"]
          company_id?: string
          config_json?: Json
          created_at?: string
          id?: string
          message_template?: string
          name?: string
          title_template?: string
          trigger_event?:
            | Database["public"]["Enums"]["automation_trigger_type"]
            | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      biolink_clicks: {
        Row: {
          biolink_item_id: string
          clicked_at: string
          id: string
          referer: string | null
          user_agent: string | null
        }
        Insert: {
          biolink_item_id: string
          clicked_at?: string
          id?: string
          referer?: string | null
          user_agent?: string | null
        }
        Update: {
          biolink_item_id?: string
          clicked_at?: string
          id?: string
          referer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biolink_clicks_biolink_item_id_fkey"
            columns: ["biolink_item_id"]
            isOneToOne: false
            referencedRelation: "biolink_items"
            referencedColumns: ["id"]
          },
        ]
      }
      biolink_items: {
        Row: {
          ativo: boolean
          biolink_id: string
          created_at: string
          icone: string | null
          id: string
          ordem: number
          tipo: Database["public"]["Enums"]["biolink_item_type"]
          titulo: string
          url: string
        }
        Insert: {
          ativo?: boolean
          biolink_id: string
          created_at?: string
          icone?: string | null
          id?: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["biolink_item_type"]
          titulo: string
          url: string
        }
        Update: {
          ativo?: boolean
          biolink_id?: string
          created_at?: string
          icone?: string | null
          id?: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["biolink_item_type"]
          titulo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "biolink_items_biolink_id_fkey"
            columns: ["biolink_id"]
            isOneToOne: false
            referencedRelation: "biolinks"
            referencedColumns: ["id"]
          },
        ]
      }
      biolink_template_items: {
        Row: {
          ativo: boolean
          created_at: string
          icone: string | null
          id: string
          ordem: number
          template_id: string
          tipo: string
          titulo: string
          url_placeholder: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          icone?: string | null
          id?: string
          ordem?: number
          template_id: string
          tipo?: string
          titulo: string
          url_placeholder?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          icone?: string | null
          id?: string
          ordem?: number
          template_id?: string
          tipo?: string
          titulo?: string
          url_placeholder?: string
        }
        Relationships: [
          {
            foreignKeyName: "biolink_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "biolink_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      biolink_templates: {
        Row: {
          categoria: string
          company_id: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preview_config: Json
        }
        Insert: {
          categoria?: string
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preview_config?: Json
        }
        Update: {
          categoria?: string
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preview_config?: Json
        }
        Relationships: [
          {
            foreignKeyName: "biolink_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      biolinks: {
        Row: {
          ativo: boolean
          company_id: string
          cor_primaria: string
          cor_secundaria: string
          created_at: string
          descricao: string | null
          id: string
          logo_url: string | null
          slug: string
          titulo: string
        }
        Insert: {
          ativo?: boolean
          company_id: string
          cor_primaria?: string
          cor_secundaria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          logo_url?: string | null
          slug: string
          titulo: string
        }
        Update: {
          ativo?: boolean
          company_id?: string
          cor_primaria?: string
          cor_secundaria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          logo_url?: string | null
          slug?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "biolinks_company_id_fkey"
            columns: ["company_id"]
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
          block_mode: string
          created_at: string
          custom_domain: string | null
          domain_verified: boolean
          favicon_url: string | null
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
          theme: string
          trial_until: string | null
        }
        Insert: {
          active_users_count?: number
          block_mode?: string
          created_at?: string
          custom_domain?: string | null
          domain_verified?: boolean
          favicon_url?: string | null
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
          theme?: string
          trial_until?: string | null
        }
        Update: {
          active_users_count?: number
          block_mode?: string
          created_at?: string
          custom_domain?: string | null
          domain_verified?: boolean
          favicon_url?: string | null
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
          theme?: string
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
      event_substitutions: {
        Row: {
          company_id: string
          created_at: string
          event_id: string
          event_team_member_id: string
          id: string
          reason: string
          replacement_user_id: string | null
          responded_at: string | null
          responded_by: string | null
          status: Database["public"]["Enums"]["substitution_status"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          event_id: string
          event_team_member_id: string
          id?: string
          reason: string
          replacement_user_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["substitution_status"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          event_id?: string
          event_team_member_id?: string
          id?: string
          reason?: string
          replacement_user_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["substitution_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_substitutions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_substitutions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_substitutions_event_team_member_id_fkey"
            columns: ["event_team_member_id"]
            isOneToOne: false
            referencedRelation: "event_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_substitutions_replacement_user_id_fkey"
            columns: ["replacement_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_substitutions_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_substitutions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          checkin_token: string | null
          checkin_window_minutes: number | null
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
          checkin_token?: string | null
          checkin_window_minutes?: number | null
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
          checkin_token?: string | null
          checkin_window_minutes?: number | null
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
      files: {
        Row: {
          company_id: string
          created_at: string
          file_type: string
          id: string
          mime_type: string
          name: string
          path: string
          provider: string
          size_bytes: number
          thumbnail_path: string | null
          uploaded_by: string
        }
        Insert: {
          company_id: string
          created_at?: string
          file_type?: string
          id?: string
          mime_type: string
          name: string
          path: string
          provider?: string
          size_bytes?: number
          thumbnail_path?: string | null
          uploaded_by: string
        }
        Update: {
          company_id?: string
          created_at?: string
          file_type?: string
          id?: string
          mime_type?: string
          name?: string
          path?: string
          provider?: string
          size_bytes?: number
          thumbnail_path?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_levels: {
        Row: {
          company_id: string
          created_at: string
          icon: string | null
          id: string
          min_points: number
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          icon?: string | null
          id?: string
          min_points?: number
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          min_points?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_levels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_points: {
        Row: {
          company_id: string
          created_at: string
          id: string
          points: number
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          points?: number
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          points?: number
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_points_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      notification_logs: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          gateway_response: string | null
          id: string
          notification_id: string
          status: Database["public"]["Enums"]["notification_send_status"]
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          gateway_response?: string | null
          id?: string
          notification_id: string
          status?: Database["public"]["Enums"]["notification_send_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          gateway_response?: string | null
          id?: string
          notification_id?: string
          status?: Database["public"]["Enums"]["notification_send_status"]
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          message_template: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          message_template: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          message_template?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          company_id: string
          created_at: string
          id: string
          message: string
          metadata: Json
          read: boolean
          sent_at: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json
          read?: boolean
          sent_at?: string
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
          read?: boolean
          sent_at?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          external_id: string | null
          gateway: string | null
          id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          external_id?: string | null
          gateway?: string | null
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          external_id?: string | null
          gateway?: string | null
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
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
          trial_days: number
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
          trial_days?: number
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
          trial_days?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          category: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability: Json
          avatar_url: string | null
          bio: string | null
          checkin_code: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          last_access_at: string | null
          name: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          phone: string | null
          preferred_roles: Json
          reliability_score: number
          settings: Json
          skills: Json
          status: Database["public"]["Enums"]["user_status"]
        }
        Insert: {
          availability?: Json
          avatar_url?: string | null
          bio?: string | null
          checkin_code?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id: string
          last_access_at?: string | null
          name: string
          permission_level?: Database["public"]["Enums"]["permission_level"]
          phone?: string | null
          preferred_roles?: Json
          reliability_score?: number
          settings?: Json
          skills?: Json
          status?: Database["public"]["Enums"]["user_status"]
        }
        Update: {
          availability?: Json
          avatar_url?: string | null
          bio?: string | null
          checkin_code?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          last_access_at?: string | null
          name?: string
          permission_level?: Database["public"]["Enums"]["permission_level"]
          phone?: string | null
          preferred_roles?: Json
          reliability_score?: number
          settings?: Json
          skills?: Json
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
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      social_accounts: {
        Row: {
          access_token: string | null
          app_id: string
          app_secret_encrypted: string
          company_id: string
          created_at: string
          id: string
          instagram_id: string | null
          instagram_username: string | null
          page_id: string | null
          page_name: string | null
          provider: string
          status: string
          token_expires_at: string | null
        }
        Insert: {
          access_token?: string | null
          app_id: string
          app_secret_encrypted: string
          company_id: string
          created_at?: string
          id?: string
          instagram_id?: string | null
          instagram_username?: string | null
          page_id?: string | null
          page_name?: string | null
          provider?: string
          status?: string
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string | null
          app_id?: string
          app_secret_encrypted?: string
          company_id?: string
          created_at?: string
          id?: string
          instagram_id?: string | null
          instagram_username?: string | null
          page_id?: string | null
          page_name?: string | null
          provider?: string
          status?: string
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_metrics: {
        Row: {
          comments: number
          company_id: string
          created_at: string
          fetched_at: string
          id: string
          likes: number
          post_id: string
          shares: number
        }
        Insert: {
          comments?: number
          company_id: string
          created_at?: string
          fetched_at?: string
          id?: string
          likes?: number
          post_id: string
          shares?: number
        }
        Update: {
          comments?: number
          company_id?: string
          created_at?: string
          fetched_at?: string
          id?: string
          likes?: number
          post_id?: string
          shares?: number
        }
        Relationships: [
          {
            foreignKeyName: "social_post_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          caption: string | null
          company_id: string
          created_at: string
          created_by: string
          error_message: string | null
          id: string
          media_type: string | null
          media_urls: Json
          meta_ig_post_id: string | null
          meta_post_id: string | null
          platform: string
          published_at: string | null
          scheduled_at: string | null
          social_account_id: string
          status: string
        }
        Insert: {
          caption?: string | null
          company_id: string
          created_at?: string
          created_by: string
          error_message?: string | null
          id?: string
          media_type?: string | null
          media_urls?: Json
          meta_ig_post_id?: string | null
          meta_post_id?: string | null
          platform?: string
          published_at?: string | null
          scheduled_at?: string | null
          social_account_id: string
          status?: string
        }
        Update: {
          caption?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          error_message?: string | null
          id?: string
          media_type?: string | null
          media_urls?: Json
          meta_ig_post_id?: string | null
          meta_post_id?: string | null
          platform?: string
          published_at?: string | null
          scheduled_at?: string | null
          social_account_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          company_id: string
          created_at: string
          ends_at: string | null
          external_id: string | null
          gateway: string | null
          id: string
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_until: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          company_id: string
          created_at?: string
          ends_at?: string | null
          external_id?: string | null
          gateway?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_until?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          company_id?: string
          created_at?: string
          ends_at?: string | null
          external_id?: string | null
          gateway?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_until?: string | null
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
      user_notification_settings: {
        Row: {
          company_id: string
          created_at: string
          email_enabled: boolean
          id: string
          push_enabled: boolean
          user_id: string
          whatsapp_enabled: boolean
        }
        Insert: {
          company_id: string
          created_at?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          user_id: string
          whatsapp_enabled?: boolean
        }
        Update: {
          company_id?: string
          created_at?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          user_id?: string
          whatsapp_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      whatsapp_configs: {
        Row: {
          active: boolean
          company_id: string
          config_json: Json
          created_at: string
          id: string
          provider: Database["public"]["Enums"]["whatsapp_provider"]
        }
        Insert: {
          active?: boolean
          company_id: string
          config_json?: Json
          created_at?: string
          id?: string
          provider?: Database["public"]["Enums"]["whatsapp_provider"]
        }
        Update: {
          active?: boolean
          company_id?: string
          config_json?: Json
          created_at?: string
          id?: string
          provider?: Database["public"]["Enums"]["whatsapp_provider"]
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      social_accounts_safe: {
        Row: {
          app_id: string | null
          company_id: string | null
          created_at: string | null
          id: string | null
          instagram_id: string | null
          instagram_username: string | null
          page_id: string | null
          page_name: string | null
          provider: string | null
          status: string | null
          token_expires_at: string | null
        }
        Insert: {
          app_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          instagram_id?: string | null
          instagram_username?: string | null
          page_id?: string | null
          page_name?: string | null
          provider?: string | null
          status?: string | null
          token_expires_at?: string | null
        }
        Update: {
          app_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          instagram_id?: string | null
          instagram_username?: string | null
          page_id?: string | null
          page_name?: string | null
          provider?: string | null
          status?: string | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_user_permission: {
        Args: { _permission_name: string; _user_id: string }
        Returns: boolean
      }
      get_company_limits: { Args: { _company_id: string }; Returns: Json }
      get_invite_by_token: {
        Args: { _token: string }
        Returns: {
          company_id: string
          company_name: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
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
      automation_channel: "whatsapp" | "push" | "email" | "in_app"
      automation_trigger_type:
        | "usuario_escalado"
        | "evento_proximo"
        | "substituicao_solicitada"
        | "substituicao_aprovada"
        | "presenca_pendente"
        | "evento_criado"
      biolink_item_type:
        | "link"
        | "whatsapp"
        | "youtube"
        | "instagram"
        | "facebook"
        | "doacao"
      checklist_status: "pendente" | "concluido"
      company_status: "ativa" | "suspensa" | "cancelada"
      event_status: "ativo" | "cancelado"
      invite_status: "pendente" | "aceito" | "expirado"
      member_status: "pendente" | "confirmado" | "ausente" | "substituido"
      notification_channel: "push" | "whatsapp" | "in_app"
      notification_send_status: "enviado" | "erro"
      notification_type: "escala" | "evento" | "aviso" | "sistema"
      payment_status: "pago" | "pendente" | "falhou" | "estornado"
      permission_level: "basico" | "avancado"
      queue_status: "pendente" | "processando" | "enviado" | "erro"
      referral_status: "pendente" | "convertido"
      reward_type: "dias_gratis" | "desconto" | "upgrade"
      subscription_status: "ativo" | "cancelado" | "trial" | "atrasado"
      substitution_status: "pendente" | "aprovado" | "rejeitado"
      ticket_status: "aberto" | "respondido" | "fechado"
      user_status: "ativo" | "inativo" | "bloqueado"
      whatsapp_provider: "meta" | "evo"
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
      automation_channel: ["whatsapp", "push", "email", "in_app"],
      automation_trigger_type: [
        "usuario_escalado",
        "evento_proximo",
        "substituicao_solicitada",
        "substituicao_aprovada",
        "presenca_pendente",
        "evento_criado",
      ],
      biolink_item_type: [
        "link",
        "whatsapp",
        "youtube",
        "instagram",
        "facebook",
        "doacao",
      ],
      checklist_status: ["pendente", "concluido"],
      company_status: ["ativa", "suspensa", "cancelada"],
      event_status: ["ativo", "cancelado"],
      invite_status: ["pendente", "aceito", "expirado"],
      member_status: ["pendente", "confirmado", "ausente", "substituido"],
      notification_channel: ["push", "whatsapp", "in_app"],
      notification_send_status: ["enviado", "erro"],
      notification_type: ["escala", "evento", "aviso", "sistema"],
      payment_status: ["pago", "pendente", "falhou", "estornado"],
      permission_level: ["basico", "avancado"],
      queue_status: ["pendente", "processando", "enviado", "erro"],
      referral_status: ["pendente", "convertido"],
      reward_type: ["dias_gratis", "desconto", "upgrade"],
      subscription_status: ["ativo", "cancelado", "trial", "atrasado"],
      substitution_status: ["pendente", "aprovado", "rejeitado"],
      ticket_status: ["aberto", "respondido", "fechado"],
      user_status: ["ativo", "inativo", "bloqueado"],
      whatsapp_provider: ["meta", "evo"],
    },
  },
} as const
