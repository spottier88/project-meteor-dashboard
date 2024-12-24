export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          status: 'sunny' | 'cloudy' | 'stormy'
          progress: 'better' | 'stable' | 'worse'
          completion: number
          last_review_date: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          status?: 'sunny' | 'cloudy' | 'stormy'
          progress?: 'better' | 'stable' | 'worse'
          completion?: number
          last_review_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          status?: 'sunny' | 'cloudy' | 'stormy'
          progress?: 'better' | 'stable' | 'worse'
          completion?: number
          last_review_date?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      project_status: 'sunny' | 'cloudy' | 'stormy'
      progress_status: 'better' | 'stable' | 'worse'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}