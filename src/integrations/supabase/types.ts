export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          completion: number
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          last_review_date: string | null
          priority: string | null
          progress: Database["public"]["Enums"]["progress_status"]
          project_manager: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
        }
        Insert: {
          completion?: number
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          last_review_date?: string | null
          priority?: string | null
          progress?: Database["public"]["Enums"]["progress_status"]
          project_manager?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
        }
        Update: {
          completion?: number
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          last_review_date?: string | null
          priority?: string | null
          progress?: Database["public"]["Enums"]["progress_status"]
          project_manager?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
        }
        Relationships: []
      }
      review_actions: {
        Row: {
          created_at: string | null
          description: string
          id: string
          review_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          review_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_review"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          progress: Database["public"]["Enums"]["progress_status"]
          project_id: string
          weather: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          progress: Database["public"]["Enums"]["progress_status"]
          project_id: string
          weather: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          progress?: Database["public"]["Enums"]["progress_status"]
          project_id?: string
          weather?: Database["public"]["Enums"]["project_status"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          created_at: string | null
          description: string
          id: string
          mitigation_plan: string | null
          probability: Database["public"]["Enums"]["risk_probability"]
          project_id: string
          severity: Database["public"]["Enums"]["risk_severity"]
          status: Database["public"]["Enums"]["risk_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          mitigation_plan?: string | null
          probability?: Database["public"]["Enums"]["risk_probability"]
          project_id: string
          severity?: Database["public"]["Enums"]["risk_severity"]
          status?: Database["public"]["Enums"]["risk_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          mitigation_plan?: string | null
          probability?: Database["public"]["Enums"]["risk_probability"]
          project_id?: string
          severity?: Database["public"]["Enums"]["risk_severity"]
          status?: Database["public"]["Enums"]["risk_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      progress_status: "better" | "stable" | "worse"
      project_status: "sunny" | "cloudy" | "stormy"
      review_type: "weather" | "progress" | "comment" | "action"
      risk_probability: "low" | "medium" | "high"
      risk_severity: "low" | "medium" | "high"
      risk_status: "open" | "in_progress" | "resolved"
      task_status: "todo" | "in_progress" | "done"
      user_role: "admin" | "direction" | "chef_projet"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
