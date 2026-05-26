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
      banner_inquiries: {
        Row: {
          budget: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          kinds: string[]
          message: string | null
          name: string | null
          notes: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          telegram: string | null
          timeline: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          kinds?: string[]
          message?: string | null
          name?: string | null
          notes?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          telegram?: string | null
          timeline?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          kinds?: string[]
          message?: string | null
          name?: string | null
          notes?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          telegram?: string | null
          timeline?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banner_inquiries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string
          author_id: string | null
          body: string
          cover_url: string | null
          created_at: string
          description: string
          id: string
          published_at: string | null
          reading_minutes: number
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          author_id?: string | null
          body?: string
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          published_at?: string | null
          reading_minutes?: number
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          author_id?: string | null
          body?: string
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          published_at?: string | null
          reading_minutes?: number
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_settings: {
        Row: {
          agency_id: string | null
          commission_pct: number
          created_at: string
          creator_id: string
          is_accepting_subscribers: boolean
          nowpayments_subaccount_id: string | null
          payout_currency: string
          stripe_account_id: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          commission_pct?: number
          created_at?: string
          creator_id: string
          is_accepting_subscribers?: boolean
          nowpayments_subaccount_id?: string | null
          payout_currency?: string
          stripe_account_id?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          commission_pct?: number
          created_at?: string
          creator_id?: string
          is_accepting_subscribers?: boolean
          nowpayments_subaccount_id?: string | null
          payout_currency?: string
          stripe_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_settings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          created_at: string
          decided_at: string | null
          id: string
          intro_media_ids: string[]
          intro_message: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          token_boost: number
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string
          decided_at?: string | null
          id?: string
          intro_media_ids?: string[]
          intro_message?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          token_boost?: number
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          intro_media_ids?: string[]
          intro_message?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          token_boost?: number
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          budget_max_cents: number | null
          budget_min_cents: number | null
          categories: string[]
          created_at: string
          currency: string
          description: string
          expires_at: string | null
          featured_until: string | null
          id: string
          location_kind: Database["public"]["Enums"]["job_location_kind"]
          location_text: string | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          poster_id: string
          promoted_score: number
          published_at: string | null
          requires_verification: boolean
          search_doc: unknown
          status: Database["public"]["Enums"]["job_status"]
          tags: string[]
          title: string
          token_cost: number
          updated_at: string
          visibility: string
        }
        Insert: {
          budget_max_cents?: number | null
          budget_min_cents?: number | null
          categories?: string[]
          created_at?: string
          currency?: string
          description?: string
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          location_kind?: Database["public"]["Enums"]["job_location_kind"]
          location_text?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          poster_id: string
          promoted_score?: number
          published_at?: string | null
          requires_verification?: boolean
          search_doc?: unknown
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[]
          title: string
          token_cost?: number
          updated_at?: string
          visibility?: string
        }
        Update: {
          budget_max_cents?: number | null
          budget_min_cents?: number | null
          categories?: string[]
          created_at?: string
          currency?: string
          description?: string
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          location_kind?: Database["public"]["Enums"]["job_location_kind"]
          location_text?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          poster_id?: string
          promoted_score?: number
          published_at?: string | null
          requires_verification?: boolean
          search_doc?: unknown
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[]
          title?: string
          token_cost?: number
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          blurhash: string | null
          byte_size: number | null
          created_at: string
          duration_seconds: number | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime_type: string | null
          mux_asset_id: string | null
          mux_playback_id: string | null
          owner_id: string
          storage_bucket: string
          storage_path: string
          width: number | null
        }
        Insert: {
          blurhash?: string | null
          byte_size?: number | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime_type?: string | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          owner_id: string
          storage_bucket: string
          storage_path: string
          width?: number | null
        }
        Update: {
          blurhash?: string | null
          byte_size?: number | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime_type?: string | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          owner_id?: string
          storage_bucket?: string
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_invoices: {
        Row: {
          amount_cents: number
          created_at: string
          creator_id: string
          currency: string
          id: string
          metadata: Json
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_invoice_id: string
          provider_payment_id: string | null
          status: string
          subscriber_id: string
          subscription_id: string | null
          tier_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          creator_id: string
          currency: string
          id?: string
          metadata?: Json
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_invoice_id: string
          provider_payment_id?: string | null
          status?: string
          subscriber_id: string
          subscription_id?: string | null
          tier_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          creator_id?: string
          currency?: string
          id?: string
          metadata?: Json
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_invoice_id?: string
          provider_payment_id?: string | null
          status?: string
          subscriber_id?: string
          subscription_id?: string | null
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_invoices_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_invoices_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_invoices_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string
          description: string
          external_url: string | null
          id: string
          media_id: string | null
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          external_url?: string | null
          id?: string
          media_id?: string | null
          sort_order?: number
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          external_url?: string | null
          id?: string
          media_id?: string | null
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body: string
          comment_count: number
          created_at: string
          creator_id: string
          id: string
          is_pinned: boolean
          kind: Database["public"]["Enums"]["post_kind"]
          like_count: number
          media_ids: string[]
          published_at: string | null
          scheduled_for: string | null
          tier_required_id: string | null
          updated_at: string
        }
        Insert: {
          body?: string
          comment_count?: number
          created_at?: string
          creator_id: string
          id?: string
          is_pinned?: boolean
          kind?: Database["public"]["Enums"]["post_kind"]
          like_count?: number
          media_ids?: string[]
          published_at?: string | null
          scheduled_for?: string | null
          tier_required_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          comment_count?: number
          created_at?: string
          creator_id?: string
          id?: string
          is_pinned?: boolean
          kind?: Database["public"]["Enums"]["post_kind"]
          like_count?: number
          media_ids?: string[]
          published_at?: string | null
          scheduled_for?: string | null
          tier_required_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_tier_required_id_fkey"
            columns: ["tier_required_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          about: string
          availability: string
          categories: string[]
          collaboration_status: string
          created_at: string
          currency: string
          experience: Json
          headline: string
          hourly_rate_cents: number | null
          languages: string[]
          links: Json
          region: string | null
          search_doc: unknown
          skills: string[]
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          about?: string
          availability?: string
          categories?: string[]
          collaboration_status?: string
          created_at?: string
          currency?: string
          experience?: Json
          headline?: string
          hourly_rate_cents?: number | null
          languages?: string[]
          links?: Json
          region?: string | null
          search_doc?: unknown
          skills?: string[]
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          about?: string
          availability?: string
          categories?: string[]
          collaboration_status?: string
          created_at?: string
          currency?: string
          experience?: Json
          headline?: string
          hourly_rate_cents?: number | null
          languages?: string[]
          links?: Json
          region?: string | null
          search_doc?: unknown
          skills?: string[]
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          applied_babehub: boolean
          avatar_url: string | null
          bio: string
          country: string | null
          cover_url: string | null
          created_at: string
          display_name: string
          handle: string
          id: string
          is_banned: boolean
          is_frozen: boolean
          is_premium: boolean
          is_verified: boolean
          onboarded_at: string | null
          premium_until: string | null
          role: Database["public"]["Enums"]["user_role"]
          roles: Database["public"]["Enums"]["user_role"][]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          applied_babehub?: boolean
          avatar_url?: string | null
          bio?: string
          country?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          handle: string
          id: string
          is_banned?: boolean
          is_frozen?: boolean
          is_premium?: boolean
          is_verified?: boolean
          onboarded_at?: string | null
          premium_until?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          roles?: Database["public"]["Enums"]["user_role"][]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          applied_babehub?: boolean
          avatar_url?: string | null
          bio?: string
          country?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          handle?: string
          id?: string
          is_banned?: boolean
          is_frozen?: boolean
          is_premium?: boolean
          is_verified?: boolean
          onboarded_at?: string | null
          premium_until?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          roles?: Database["public"]["Enums"]["user_role"][]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          active: boolean
          created_at: string
          creator_id: string
          currency: string
          description: string
          id: string
          name: string
          perks: Json
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          creator_id: string
          currency?: string
          description?: string
          id?: string
          name: string
          perks?: Json
          price_cents: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string
          id?: string
          name?: string
          perks?: Json
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_tiers_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          creator_id: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          subscriber_id: string
          tier_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          creator_id: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscriber_id: string
          tier_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          creator_id?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscriber_id?: string
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_submissions: {
        Row: {
          agrees_to_profit_share: boolean
          content_type: string | null
          country: string | null
          created_at: string
          email: string
          goals: string | null
          id: string
          interested_in_campaigns: boolean
          is_active_creator: boolean | null
          is_generating_revenue: boolean | null
          is_over_18: boolean | null
          monthly_earnings: string | null
          name: string
          notes: string
          reviewed_at: string | null
          reviewed_by: string | null
          social_handle: string | null
          social_platform: string | null
          status: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          agrees_to_profit_share?: boolean
          content_type?: string | null
          country?: string | null
          created_at?: string
          email: string
          goals?: string | null
          id?: string
          interested_in_campaigns?: boolean
          is_active_creator?: boolean | null
          is_generating_revenue?: boolean | null
          is_over_18?: boolean | null
          monthly_earnings?: string | null
          name?: string
          notes?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_handle?: string | null
          social_platform?: string | null
          status?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          agrees_to_profit_share?: boolean
          content_type?: string | null
          country?: string | null
          created_at?: string
          email?: string
          goals?: string | null
          id?: string
          interested_in_campaigns?: boolean
          is_active_creator?: boolean | null
          is_generating_revenue?: boolean | null
          is_over_18?: boolean | null
          monthly_earnings?: string | null
          name?: string
          notes?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_handle?: string | null
          social_platform?: string | null
          status?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_comments: {
        Row: {
          body: string
          content_id: string
          created_at: string
          edited_at: string | null
          id: string
          provider: Database["public"]["Enums"]["content_provider"]
          user_id: string
        }
        Insert: {
          body: string
          content_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          provider: Database["public"]["Enums"]["content_provider"]
          user_id: string
        }
        Update: {
          body?: string
          content_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          provider?: Database["public"]["Enums"]["content_provider"]
          user_id?: string
        }
        Relationships: []
      }
      video_favorites: {
        Row: {
          content_id: string
          created_at: string
          embed_url: string | null
          provider: Database["public"]["Enums"]["content_provider"]
          source_url: string | null
          thumb_url: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          embed_url?: string | null
          provider: Database["public"]["Enums"]["content_provider"]
          source_url?: string | null
          thumb_url?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          embed_url?: string | null
          provider?: Database["public"]["Enums"]["content_provider"]
          source_url?: string | null
          thumb_url?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          content_id: string
          created_at: string
          provider: Database["public"]["Enums"]["content_provider"]
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          provider: Database["public"]["Enums"]["content_provider"]
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          provider?: Database["public"]["Enums"]["content_provider"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: {
          fan_id: string
          required_tier_id?: string
          target_creator_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      application_status:
        | "pending"
        | "viewed"
        | "shortlisted"
        | "accepted"
        | "rejected"
        | "withdrawn"
      content_provider: "creator_post" | "eporner"
      job_location_kind: "remote" | "onsite" | "hybrid"
      job_status: "draft" | "published" | "paused" | "expired" | "closed"
      media_kind: "image" | "video"
      moderation_status: "pending" | "approved" | "rejected" | "flagged"
      payment_provider: "stripe" | "nowpayments" | "cryptomus"
      post_kind: "text" | "image" | "video" | "gallery"
      subscription_status:
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "trialing"
      user_role:
        | "fan"
        | "creator"
        | "chatter"
        | "admin"
        | "recruiter"
        | "agency"
        | "brand"
        | "service_provider"
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
      application_status: [
        "pending",
        "viewed",
        "shortlisted",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      content_provider: ["creator_post", "eporner"],
      job_location_kind: ["remote", "onsite", "hybrid"],
      job_status: ["draft", "published", "paused", "expired", "closed"],
      media_kind: ["image", "video"],
      moderation_status: ["pending", "approved", "rejected", "flagged"],
      payment_provider: ["stripe", "nowpayments", "cryptomus"],
      post_kind: ["text", "image", "video", "gallery"],
      subscription_status: [
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "trialing",
      ],
      user_role: [
        "fan",
        "creator",
        "chatter",
        "admin",
        "recruiter",
        "agency",
        "brand",
        "service_provider",
      ],
    },
  },
} as const
