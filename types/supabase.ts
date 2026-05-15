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
      budgets: {
        Row: {
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          limit_amount: number
          month: number | null
          priority_order: number | null
          rollover_policy: string | null
          spent_amount: number | null
          updated_at: string | null
          user_id: string | null
          year: number | null
        }
        Insert: {
          category_icon?: string | null
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          limit_amount: number
          month?: number | null
          priority_order?: number | null
          rollover_policy?: string | null
          spent_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Update: {
          category_icon?: string | null
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          limit_amount?: number
          month?: number | null
          priority_order?: number | null
          rollover_policy?: string | null
          spent_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          emoji: string | null
          icon: string | null
          id: string
          is_deleted: boolean | null
          mapping_keywords: string[] | null
          name: string
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_deleted?: boolean | null
          mapping_keywords?: string[] | null
          name: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_deleted?: boolean | null
          mapping_keywords?: string[] | null
          name?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string | null
          due_day: number | null
          id: string
          interest_rate: number | null
          is_deleted: boolean | null
          minimum_payment: number | null
          name: string
          principal_amount: number | null
          remaining_amount: number
          remaining_installments: number | null
          total_amount: number
          total_installments: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          due_day?: number | null
          id?: string
          interest_rate?: number | null
          is_deleted?: boolean | null
          minimum_payment?: number | null
          name: string
          principal_amount?: number | null
          remaining_amount: number
          remaining_installments?: number | null
          total_amount: number
          total_installments?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          due_day?: number | null
          id?: string
          interest_rate?: number | null
          is_deleted?: boolean | null
          minimum_payment?: number | null
          name?: string
          principal_amount?: number | null
          remaining_amount?: number
          remaining_installments?: number | null
          total_amount?: number
          total_installments?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_deleted: boolean | null
          linked_wallet_id: string | null
          name: string
          target_amount: number
          target_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          linked_wallet_id?: string | null
          name: string
          target_amount: number
          target_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          linked_wallet_id?: string | null
          name?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_linked_wallet_id_fkey"
            columns: ["linked_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_bills: {
        Row: {
          amount: number
          created_at: string | null
          due_day: number | null
          id: string
          is_deleted: boolean | null
          is_paid: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_day?: number | null
          id?: string
          is_deleted?: boolean | null
          is_paid?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_day?: number | null
          id?: string
          is_deleted?: boolean | null
          is_paid?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_bills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          base_currency: string | null
          created_at: string | null
          health_score: number | null
          id: string
          is_deleted: boolean | null
          name: string | null
          nickname: string | null
          persona: string | null
          pin_hash: string | null
          tax_deductions: Json | null
          updated_at: string | null
        }
        Insert: {
          base_currency?: string | null
          created_at?: string | null
          health_score?: number | null
          id: string
          is_deleted?: boolean | null
          name?: string | null
          nickname?: string | null
          persona?: string | null
          pin_hash?: string | null
          tax_deductions?: Json | null
          updated_at?: string | null
        }
        Update: {
          base_currency?: string | null
          created_at?: string | null
          health_score?: number | null
          id?: string
          is_deleted?: boolean | null
          name?: string | null
          nickname?: string | null
          persona?: string | null
          pin_hash?: string | null
          tax_deductions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          amount_thb: number | null
          budget_id: string | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          emoji: string | null
          exchange_rate: number | null
          id: string
          is_ai_generated: boolean | null
          is_deleted: boolean | null
          is_split: boolean | null
          note: string | null
          ocr_image_url: string | null
          split_pending_amount: number | null
          transaction_date: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount: number
          amount_thb?: number | null
          budget_id?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          emoji?: string | null
          exchange_rate?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_deleted?: boolean | null
          is_split?: boolean | null
          note?: string | null
          ocr_image_url?: string | null
          split_pending_amount?: number | null
          transaction_date?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          amount_thb?: number | null
          budget_id?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          emoji?: string | null
          exchange_rate?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_deleted?: boolean | null
          is_split?: boolean | null
          note?: string | null
          ocr_image_url?: string | null
          split_pending_amount?: number | null
          transaction_date?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          credit_limit: number | null
          icon: string | null
          id: string
          is_deleted: boolean | null
          name: string
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          credit_limit?: number | null
          icon?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          credit_limit?: number | null
          icon?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

