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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          created_at: string
          generated_content: string
          generation_type: string
          id: string
          metadata: Json | null
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_content: string
          generation_type: string
          id?: string
          metadata?: Json | null
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_content?: string
          generation_type?: string
          id?: string
          metadata?: Json | null
          prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      application_events: {
        Row: {
          application_id: string
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          stage: string
          status: string
        }
        Insert: {
          application_id: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          stage: string
          status: string
        }
        Update: {
          application_id?: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          created_at: string
          estimated_completion_date: string | null
          external_app_id: string | null
          id: string
          progress_percentage: number | null
          scheme_id: string | null
          service_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_completion_date?: string | null
          external_app_id?: string | null
          id?: string
          progress_percentage?: number | null
          scheme_id?: string | null
          service_id?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_completion_date?: string | null
          external_app_id?: string | null
          id?: string
          progress_percentage?: number | null
          scheme_id?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          page_number: number | null
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          id: string
          mime_type: string | null
          name: string
          page_count: number | null
          size_bytes: number | null
          status: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string | null
          name: string
          page_count?: number | null
          size_bytes?: number | null
          status?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string | null
          name?: string
          page_count?: number | null
          size_bytes?: number | null
          status?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          content: string | null
          created_at: string
          document_id: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_comparisons: {
        Row: {
          created_at: string
          id: string
          policy_a_id: string | null
          policy_b_id: string | null
          result_summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          policy_a_id?: string | null
          policy_b_id?: string | null
          result_summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          policy_a_id?: string | null
          policy_b_id?: string | null
          result_summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_comparisons_policy_a_id_fkey"
            columns: ["policy_a_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_comparisons_policy_b_id_fkey"
            columns: ["policy_b_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_conflicts: {
        Row: {
          clause_title: string | null
          comparison_id: string
          created_at: string
          doc_a_value: string | null
          doc_b_value: string | null
          id: string
          issue: string | null
          recommendation: string | null
          severity: string | null
        }
        Insert: {
          clause_title?: string | null
          comparison_id: string
          created_at?: string
          doc_a_value?: string | null
          doc_b_value?: string | null
          id?: string
          issue?: string | null
          recommendation?: string | null
          severity?: string | null
        }
        Update: {
          clause_title?: string | null
          comparison_id?: string
          created_at?: string
          doc_a_value?: string | null
          doc_b_value?: string | null
          id?: string
          issue?: string | null
          recommendation?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_conflicts_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "policy_comparisons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      scheme_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      scheme_requirements: {
        Row: {
          created_at: string
          description: string
          id: string
          requirement_type: string
          scheme_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          requirement_type: string
          scheme_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          requirement_type?: string
          scheme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheme_requirements_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      schemes: {
        Row: {
          application_process: string | null
          application_url: string | null
          benefits: string | null
          category: string | null
          created_at: string
          deadline: string | null
          department: string
          description: string | null
          eligibility_summary: string | null
          id: string
          last_verified_at: string | null
          ministry: string | null
          name: string
          official_source: string | null
          source_url: string | null
          state_or_ut: string | null
          target_audience: string | null
          type: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          application_process?: string | null
          application_url?: string | null
          benefits?: string | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          department: string
          description?: string | null
          eligibility_summary?: string | null
          id?: string
          last_verified_at?: string | null
          ministry?: string | null
          name: string
          official_source?: string | null
          source_url?: string | null
          state_or_ut?: string | null
          target_audience?: string | null
          type?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          application_process?: string | null
          application_url?: string | null
          benefits?: string | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          department?: string
          description?: string | null
          eligibility_summary?: string | null
          id?: string
          last_verified_at?: string | null
          ministry?: string | null
          name?: string
          official_source?: string | null
          source_url?: string | null
          state_or_ut?: string | null
          target_audience?: string | null
          type?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      service_requirements: {
        Row: {
          created_at: string
          description: string
          id: string
          is_mandatory: boolean | null
          service_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_mandatory?: boolean | null
          service_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_mandatory?: boolean | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requirements_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_steps: {
        Row: {
          created_at: string
          detail: string | null
          estimated_days: string | null
          id: string
          service_id: string
          step_order: number
          title: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          estimated_days?: string | null
          id?: string
          service_id: string
          step_order: number
          title: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          estimated_days?: string | null
          id?: string
          service_id?: string
          step_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_steps_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          department: string
          description: string | null
          fee: string | null
          id: string
          last_verified_at: string | null
          ministry: string | null
          name: string
          official_source: string | null
          source_url: string | null
          timeline: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          created_at?: string
          department: string
          description?: string | null
          fee?: string | null
          id?: string
          last_verified_at?: string | null
          ministry?: string | null
          name: string
          official_source?: string | null
          source_url?: string | null
          timeline?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          created_at?: string
          department?: string
          description?: string | null
          fee?: string | null
          id?: string
          last_verified_at?: string | null
          ministry?: string | null
          name?: string
          official_source?: string | null
          source_url?: string | null
          timeline?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
