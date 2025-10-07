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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          project_id: string | null
          start_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          project_id?: string | null
          start_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          project_id?: string | null
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
            foreignKeyName: "fk_activity_type"
            columns: ["activity_type"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["code"]
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
      activity_type_permissions: {
        Row: {
          activity_type_code: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          activity_type_code: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          activity_type_code?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_type_permissions_activity_type_code_fkey"
            columns: ["activity_type_code"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["code"]
          },
        ]
      }
      activity_types: {
        Row: {
          code: string
          color: string
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean
          label: string
          updated_at: string | null
        }
        Insert: {
          code: string
          color?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          color?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          section: string
          template: string
          type: string
          updated_at: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          section: string
          template: string
          type: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          section?: string
          template?: string
          type?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      application_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          type: Database["public"]["Enums"]["setting_type"]
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          type: Database["public"]["Enums"]["setting_type"]
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          type?: Database["public"]["Enums"]["setting_type"]
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      calendar_imports: {
        Row: {
          calendar_url: string | null
          created_at: string | null
          id: string
          import_date: string | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calendar_url?: string | null
          created_at?: string | null
          id?: string
          import_date?: string | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calendar_url?: string | null
          created_at?: string | null
          id?: string
          import_date?: string | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_imports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          required: boolean | null
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
          required?: boolean | null
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
          required?: boolean | null
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
      portfolio_managers: {
        Row: {
          created_at: string | null
          id: string
          portfolio_id: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          portfolio_id?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          portfolio_id?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_managers_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "project_portfolios"
            referencedColumns: ["id"]
          },
        ]
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
      project_codes: {
        Row: {
          code: string
          created_at: string | null
          project_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          project_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_codes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_framing: {
        Row: {
          context: string | null
          created_at: string | null
          deliverables: string | null
          governance: string | null
          id: string
          objectives: string | null
          project_id: string | null
          stakeholders: string | null
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          deliverables?: string | null
          governance?: string | null
          id?: string
          objectives?: string | null
          project_id?: string | null
          stakeholders?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          deliverables?: string | null
          governance?: string | null
          id?: string
          objectives?: string | null
          project_id?: string | null
          stakeholders?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_framing_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string
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
      project_portfolios: {
        Row: {
          budget_total: number | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          strategic_objectives: string | null
          updated_at: string | null
        }
        Insert: {
          budget_total?: number | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          strategic_objectives?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_total?: number | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          strategic_objectives?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_template_tasks: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number | null
          id: string
          order_index: number
          parent_task_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          order_index?: number
          parent_task_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          template_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          order_index?: number
          parent_task_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_template_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "project_template_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          direction_id: string | null
          end_date: string | null
          for_entity_id: string | null
          for_entity_type: string | null
          id: string
          last_review_date: string | null
          lifecycle_status: Database["public"]["Enums"]["project_lifecycle_status"]
          owner_id: string | null
          path_id: string | null
          pole_id: string | null
          portfolio_id: string | null
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
          for_entity_id?: string | null
          for_entity_type?: string | null
          id?: string
          last_review_date?: string | null
          lifecycle_status?: Database["public"]["Enums"]["project_lifecycle_status"]
          owner_id?: string | null
          path_id?: string | null
          pole_id?: string | null
          portfolio_id?: string | null
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
          for_entity_id?: string | null
          for_entity_type?: string | null
          id?: string
          last_review_date?: string | null
          lifecycle_status?: Database["public"]["Enums"]["project_lifecycle_status"]
          owner_id?: string | null
          path_id?: string | null
          pole_id?: string | null
          portfolio_id?: string | null
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
            foreignKeyName: "projects_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "project_portfolios"
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
          parent_task_id: string | null
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
          parent_task_id?: string | null
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
          parent_task_id?: string | null
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_parent_task"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
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
      user_preferences: {
        Row: {
          created_at: string
          id: string
          open_projects_in_new_tab: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          open_projects_in_new_tab?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          open_projects_in_new_tab?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      can_assign_to_portfolio: {
        Args: { p_portfolio_id: string; p_user_id: string }
        Returns: boolean
      }
      can_manage_portfolio_simple: {
        Args: { p_portfolio_id: string; p_user_id: string }
        Returns: boolean
      }
      can_manage_project: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      can_manage_project_members: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      can_manage_project_organization: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      can_manage_project_team: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      can_manager_access_project: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      can_manager_access_projects: {
        Args: { p_project_ids: string[]; p_user_id: string }
        Returns: {
          can_access: boolean
          project_id: string
        }[]
      }
      can_use_activity_type: {
        Args: { p_activity_type_code: string; p_user_id: string }
        Returns: boolean
      }
      can_view_project_members: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      generate_project_code: {
        Args: { project_uuid: string }
        Returns: string
      }
      get_accessible_portfolios: {
        Args: { p_user_id: string }
        Returns: {
          average_completion: number
          budget_total: number
          completed_projects: number
          created_at: string
          created_by: string
          description: string
          end_date: string
          id: string
          name: string
          project_count: number
          start_date: string
          status: string
          strategic_objectives: string
          updated_at: string
        }[]
      }
      get_accessible_project_managers: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      get_accessible_projects: {
        Args: { p_user_id: string }
        Returns: {
          completion: number
          direction_id: string
          id: string
          last_review_date: string
          lifecycle_status: Database["public"]["Enums"]["project_lifecycle_status"]
          owner_id: string
          pole_id: string
          progress: Database["public"]["Enums"]["progress_status"]
          project_manager: string
          service_id: string
          status: Database["public"]["Enums"]["project_status"]
          suivi_dgs: boolean
          title: string
        }[]
      }
      get_accessible_projects_list_view: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_accessible_projects_list_view_with_admin_mode: {
        Args: { p_admin_mode_disabled?: boolean; p_user_id: string }
        Returns: Json
      }
      get_detailed_projects: {
        Args: { p_project_ids: string[] }
        Returns: Json
      }
      get_projects_list_view: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_reviewable_projects: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          last_review_date: string
          project_manager: string
          status: Database["public"]["Enums"]["project_status"]
          title: string
          weather: Database["public"]["Enums"]["project_status"]
        }[]
      }
      get_team_view_projects: {
        Args: { p_user_id: string }
        Returns: {
          direction_id: string
          id: string
          pole_id: string
          project_manager: string
          project_manager_id: string
          service_id: string
          title: string
        }[]
      }
      get_team_view_users: {
        Args: { p_user_id: string }
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      get_users_last_login: {
        Args: Record<PropertyKey, never>
        Returns: {
          last_sign_in_at: string
          user_id: string
        }[]
      }
      get_users_without_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          id: string
        }[]
      }
      is_portfolio_owner: {
        Args: { p_portfolio_id: string; p_user_id: string }
        Returns: boolean
      }
      update_portfolio_stats: {
        Args: { p_portfolio_id: string }
        Returns: undefined
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
      setting_type: "microsoft_graph" | "openai" | "documentation" | "activity"
      task_status: "todo" | "in_progress" | "done"
      user_hierarchy_level: "pole" | "direction" | "service"
      user_role:
        | "admin"
        | "chef_projet"
        | "manager"
        | "membre"
        | "time_tracker"
        | "portfolio_manager"
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
      activity_type: [
        "meeting",
        "development",
        "testing",
        "documentation",
        "support",
        "other",
      ],
      monitoring_level: ["none", "dgs", "pole", "direction"],
      notification_type: ["system", "user", "feedback"],
      progress_status: ["better", "stable", "worse"],
      project_lifecycle_status: [
        "study",
        "validated",
        "in_progress",
        "completed",
        "suspended",
        "abandoned",
      ],
      project_status: ["sunny", "cloudy", "stormy"],
      review_type: ["weather", "progress", "comment", "action"],
      risk_probability: ["low", "medium", "high"],
      risk_severity: ["low", "medium", "high"],
      risk_status: ["open", "in_progress", "resolved"],
      setting_type: ["microsoft_graph", "openai", "documentation", "activity"],
      task_status: ["todo", "in_progress", "done"],
      user_hierarchy_level: ["pole", "direction", "service"],
      user_role: [
        "admin",
        "chef_projet",
        "manager",
        "membre",
        "time_tracker",
        "portfolio_manager",
      ],
    },
  },
} as const
