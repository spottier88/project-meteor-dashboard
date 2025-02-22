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
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          project_id: string
          start_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          project_id: string
          start_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          project_id?: string
          start_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_activities_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      directions: {
        Row: {
          created_at: string | null
          id: string
          name: string
          pole_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          pole_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          pole_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "directions_pole_id_fkey"
            columns: ["pole_id"]
            isOneToOne: false
            referencedRelation: "poles"
            referencedColumns: ["id"]
          },
        ]
      }
      hierarchy_paths: {
        Row: {
          created_at: string | null
          direction_id: string | null
          id: string
          path_string: string
          pole_id: string | null
          service_id: string | null
        }
        Insert: {
          created_at?: string | null
          direction_id?: string | null
          id?: string
          path_string: string
          pole_id?: string | null
          service_id?: string | null
        }
        Update: {
          created_at?: string | null
          direction_id?: string | null
          id?: string
          path_string?: string
          pole_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hierarchy_paths_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_paths_pole_id_fkey"
            columns: ["pole_id"]
            isOneToOne: false
            referencedRelation: "poles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hierarchy_paths_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_assignments: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temp_manager_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_path_assignments: {
        Row: {
          created_at: string | null
          id: string
          path_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          path_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          path_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_path_assignments_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_path_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_target_users: {
        Row: {
          created_at: string | null
          id: string
          notification_target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_target_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_target_users_notification_target_id_fkey"
            columns: ["notification_target_id"]
            isOneToOne: false
            referencedRelation: "notification_targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_target_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_targets: {
        Row: {
          created_at: string | null
          id: string
          notification_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_targets_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: true
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          publication_date: string
          published: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          publication_date: string
          published?: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          publication_date?: string
          published?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poles: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: []
      }
      project_innovation_scores: {
        Row: {
          agilite: number
          created_at: string | null
          id: string
          impact: number
          novateur: number
          ouverture: number
          project_id: string
          updated_at: string | null
          usager: number
        }
        Insert: {
          agilite?: number
          created_at?: string | null
          id?: string
          impact?: number
          novateur?: number
          ouverture?: number
          project_id: string
          updated_at?: string | null
          usager?: number
        }
        Update: {
          agilite?: number
          created_at?: string | null
          id?: string
          impact?: number
          novateur?: number
          ouverture?: number
          project_id?: string
          updated_at?: string | null
          usager?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_innovation_scores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_monitoring: {
        Row: {
          created_at: string | null
          id: string
          monitoring_entity_id: string | null
          monitoring_level: Database["public"]["Enums"]["monitoring_level"]
          project_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          monitoring_entity_id?: string | null
          monitoring_level?: Database["public"]["Enums"]["monitoring_level"]
          project_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          monitoring_entity_id?: string | null
          monitoring_level?: Database["public"]["Enums"]["monitoring_level"]
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_monitoring_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          direction_id: string | null
          end_date: string | null
          id: string
          last_review_date: string | null
          lifecycle_status: Database["public"]["Enums"]["project_lifecycle_status"]
          owner_id: string | null
          path_id: string | null
          pole_id: string | null
          priority: string | null
          progress: Database["public"]["Enums"]["progress_status"] | null
          project_manager: string | null
          project_manager_id: string | null
          service_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          suivi_dgs: boolean | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          direction_id?: string | null
          end_date?: string | null
          id?: string
          last_review_date?: string | null
          lifecycle_status?: Database["public"]["Enums"]["project_lifecycle_status"]
          owner_id?: string | null
          path_id?: string | null
          pole_id?: string | null
          priority?: string | null
          progress?: Database["public"]["Enums"]["progress_status"] | null
          project_manager?: string | null
          project_manager_id?: string | null
          service_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          suivi_dgs?: boolean | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          direction_id?: string | null
          end_date?: string | null
          id?: string
          last_review_date?: string | null
          lifecycle_status?: Database["public"]["Enums"]["project_lifecycle_status"]
          owner_id?: string | null
          path_id?: string | null
          pole_id?: string | null
          priority?: string | null
          progress?: Database["public"]["Enums"]["progress_status"] | null
          project_manager?: string | null
          project_manager_id?: string | null
          service_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          suivi_dgs?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_manager"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_pole_id_fkey"
            columns: ["pole_id"]
            isOneToOne: false
            referencedRelation: "poles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "latest_reviews"
            referencedColumns: ["review_id"]
          },
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
          completion: number
          created_at: string | null
          id: string
          progress: Database["public"]["Enums"]["progress_status"]
          project_id: string
          weather: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          comment?: string | null
          completion?: number
          created_at?: string | null
          id?: string
          progress: Database["public"]["Enums"]["progress_status"]
          project_id: string
          weather: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          comment?: string | null
          completion?: number
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
      services: {
        Row: {
          created_at: string | null
          direction_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          direction_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          direction_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
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
          start_date: string | null
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
          start_date?: string | null
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
          start_date?: string | null
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
      user_hierarchy_assignments: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["user_hierarchy_level"]
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["user_hierarchy_level"]
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["user_hierarchy_level"]
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_hierarchy_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string | null
          id: string
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      latest_reviews: {
        Row: {
          comment: string | null
          completion: number | null
          created_at: string | null
          progress: Database["public"]["Enums"]["progress_status"] | null
          project_id: string | null
          review_id: string | null
          weather: Database["public"]["Enums"]["project_status"] | null
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
    }
    Functions: {
      can_access_project: {
        Args: {
          p_user_id: string
          p_project_id: string
        }
        Returns: boolean
      }
      can_manage_project: {
        Args: {
          p_user_id: string
          p_project_id: string
        }
        Returns: boolean
      }
      can_manage_project_members: {
        Args: {
          p_project_id: string
        }
        Returns: boolean
      }
      can_manage_project_organization: {
        Args: {
          p_user_id: string
          p_project_id: string
        }
        Returns: boolean
      }
      can_manage_project_team: {
        Args: {
          p_user_id: string
          p_project_id: string
        }
        Returns: boolean
      }
      can_manager_access_project: {
        Args: {
          p_user_id: string
          p_project_id: string
        }
        Returns: boolean
      }
      can_manager_access_projects: {
        Args: {
          p_user_id: string
          p_project_ids: string[]
        }
        Returns: {
          project_id: string
          can_access: boolean
        }[]
      }
      get_accessible_projects: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          title: string
          status: Database["public"]["Enums"]["project_status"]
          progress: Database["public"]["Enums"]["progress_status"]
          last_review_date: string
          project_manager: string
          owner_id: string
          pole_id: string
          direction_id: string
          service_id: string
          lifecycle_status: Database["public"]["Enums"]["project_lifecycle_status"]
          completion: number
          suivi_dgs: boolean
        }[]
      }
      get_team_view_projects: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          title: string
          project_manager: string
          project_manager_id: string
          pole_id: string
          direction_id: string
          service_id: string
        }[]
      }
      get_users_last_login: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          last_sign_in_at: string
        }[]
      }
      get_users_without_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
        }[]
      }
    }
    Enums: {
      activity_type:
        | "meeting"
        | "development"
        | "testing"
        | "documentation"
        | "support"
        | "other"
      monitoring_level: "none" | "dgs" | "pole" | "direction"
      notification_type: "system" | "user" | "feedback"
      progress_status: "better" | "stable" | "worse"
      project_lifecycle_status:
        | "study"
        | "validated"
        | "in_progress"
        | "completed"
        | "suspended"
        | "abandoned"
      project_status: "sunny" | "cloudy" | "stormy"
      review_type: "weather" | "progress" | "comment" | "action"
      risk_probability: "low" | "medium" | "high"
      risk_severity: "low" | "medium" | "high"
      risk_status: "open" | "in_progress" | "resolved"
      task_status: "todo" | "in_progress" | "done"
      user_hierarchy_level: "pole" | "direction" | "service"
      user_role: "admin" | "chef_projet" | "manager" | "membre"
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
