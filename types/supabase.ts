// Generated from Supabase project `gpewtvzaatcqyquogxlh` via the Supabase MCP
// `generate_typescript_types` tool. Re-run after any schema migration:
//
//   - Through the MCP: invoke `generate_typescript_types` with the project id
//     and overwrite this file with the output.
//   - Or with the CLI:
//       npx supabase gen types typescript --project-id gpewtvzaatcqyquogxlh > types/supabase.ts
//
// Do not hand-edit. Keep this file in version control so type-checks in CI
// match the live database schema.

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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          cover_url: string | null
          created_at: string
          display_name: string
          handle: string
          id: string
          is_verified: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          cover_url?: string | null
          created_at?: string
          display_name?: string
          handle: string
          id: string
          is_verified?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          cover_url?: string | null
          created_at?: string
          display_name?: string
          handle?: string
          id?: string
          is_verified?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
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
      media_kind: "image" | "video"
      payment_provider: "stripe" | "nowpayments"
      post_kind: "text" | "image" | "video" | "gallery"
      subscription_status:
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "trialing"
      user_role: "fan" | "creator" | "chatter" | "admin"
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
      media_kind: ["image", "video"],
      payment_provider: ["stripe", "nowpayments"],
      post_kind: ["text", "image", "video", "gallery"],
      subscription_status: [
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "trialing",
      ],
      user_role: ["fan", "creator", "chatter", "admin"],
    },
  },
} as const
