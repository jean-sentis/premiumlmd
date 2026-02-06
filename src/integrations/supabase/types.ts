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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alert_lot_views: {
        Row: {
          alert_id: string
          id: string
          lot_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          alert_id: string
          id?: string
          lot_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          alert_id?: string
          id?: string
          lot_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_lot_views_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "user_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_lot_views_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "interencheres_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      bordereaux: {
        Row: {
          adjudication_price: number
          bordereau_number: string
          created_at: string
          fees_amount: number
          id: string
          lot_id: string | null
          paid_at: string | null
          payment_method: string | null
          pdf_url: string | null
          sale_id: string | null
          status: string
          total_ttc: number
          updated_at: string
          user_id: string
        }
        Insert: {
          adjudication_price: number
          bordereau_number: string
          created_at?: string
          fees_amount: number
          id?: string
          lot_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          sale_id?: string | null
          status?: string
          total_ttc: number
          updated_at?: string
          user_id: string
        }
        Update: {
          adjudication_price?: number
          bordereau_number?: string
          created_at?: string
          fees_amount?: number
          id?: string
          lot_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          sale_id?: string | null
          status?: string
          total_ttc?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bordereaux_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "interencheres_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bordereaux_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "interencheres_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      estimation_requests: {
        Row: {
          ai_analysis: Json | null
          ai_analyzed_at: string | null
          auctioneer_decision: string | null
          auctioneer_notes: string | null
          created_at: string
          decided_at: string | null
          description: string
          email: string
          estimated_value: string | null
          id: string
          nom: string
          object_category: string | null
          photo_urls: string[] | null
          related_lot_id: string | null
          responded_at: string | null
          response_message: string | null
          response_template: string | null
          source: string
          status: string
          telephone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_analyzed_at?: string | null
          auctioneer_decision?: string | null
          auctioneer_notes?: string | null
          created_at?: string
          decided_at?: string | null
          description: string
          email: string
          estimated_value?: string | null
          id?: string
          nom: string
          object_category?: string | null
          photo_urls?: string[] | null
          related_lot_id?: string | null
          responded_at?: string | null
          response_message?: string | null
          response_template?: string | null
          source?: string
          status?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_analyzed_at?: string | null
          auctioneer_decision?: string | null
          auctioneer_notes?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string
          email?: string
          estimated_value?: string | null
          id?: string
          nom?: string
          object_category?: string | null
          photo_urls?: string[] | null
          related_lot_id?: string | null
          responded_at?: string | null
          response_message?: string | null
          response_template?: string | null
          source?: string
          status?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimation_requests_related_lot_id_fkey"
            columns: ["related_lot_id"]
            isOneToOne: false
            referencedRelation: "interencheres_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      info_requests: {
        Row: {
          created_at: string
          id: string
          lot_id: string
          message: string
          responded_at: string | null
          response: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lot_id: string
          message: string
          responded_at?: string | null
          response?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lot_id?: string
          message?: string
          responded_at?: string | null
          response?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "info_requests_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "interencheres_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      interencheres_cache: {
        Row: {
          expires_at: string
          house_id: string
          id: string
          raw_data: Json
          scraped_at: string
        }
        Insert: {
          expires_at?: string
          house_id: string
          id?: string
          raw_data: Json
          scraped_at?: string
        }
        Update: {
          expires_at?: string
          house_id?: string
          id?: string
          raw_data?: Json
          scraped_at?: string
        }
        Relationships: []
      }
      interencheres_expositions: {
        Row: {
          created_at: string
          end_time: string | null
          exposition_date: string
          id: string
          location: string | null
          notes: string | null
          sale_id: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          exposition_date: string
          id?: string
          location?: string | null
          notes?: string | null
          sale_id?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          exposition_date?: string
          id?: string
          location?: string | null
          notes?: string | null
          sale_id?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interencheres_expositions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "interencheres_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      interencheres_lots: {
        Row: {
          adjudication_price: number | null
          after_sale_end_date: string | null
          after_sale_price: number | null
          categories: Json | null
          created_at: string
          description: string | null
          dimensions: string | null
          estimate_currency: string | null
          estimate_high: number | null
          estimate_low: number | null
          id: string
          images: Json | null
          interencheres_lot_id: string
          is_after_sale: boolean | null
          lot_number: number
          lot_url: string
          sale_id: string | null
          title: string
          updated_at: string
          winner_user_id: string | null
        }
        Insert: {
          adjudication_price?: number | null
          after_sale_end_date?: string | null
          after_sale_price?: number | null
          categories?: Json | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          estimate_currency?: string | null
          estimate_high?: number | null
          estimate_low?: number | null
          id?: string
          images?: Json | null
          interencheres_lot_id: string
          is_after_sale?: boolean | null
          lot_number: number
          lot_url: string
          sale_id?: string | null
          title: string
          updated_at?: string
          winner_user_id?: string | null
        }
        Update: {
          adjudication_price?: number | null
          after_sale_end_date?: string | null
          after_sale_price?: number | null
          categories?: Json | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          estimate_currency?: string | null
          estimate_high?: number | null
          estimate_low?: number | null
          id?: string
          images?: Json | null
          interencheres_lot_id?: string
          is_after_sale?: boolean | null
          lot_number?: number
          lot_url?: string
          sale_id?: string | null
          title?: string
          updated_at?: string
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interencheres_lots_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "interencheres_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      interencheres_sales: {
        Row: {
          catalog_url: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          fees_info: string | null
          house_id: string
          id: string
          interencheres_id: string | null
          location: string | null
          lot_count: number | null
          sale_date: string | null
          sale_type: string | null
          sale_url: string
          specialty: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          catalog_url?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          fees_info?: string | null
          house_id?: string
          id?: string
          interencheres_id?: string | null
          location?: string | null
          lot_count?: number | null
          sale_date?: string | null
          sale_type?: string | null
          sale_url: string
          specialty?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          catalog_url?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          fees_info?: string | null
          house_id?: string
          id?: string
          interencheres_id?: string | null
          location?: string | null
          lot_count?: number | null
          sale_date?: string | null
          sale_type?: string | null
          sale_url?: string
          specialty?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lia_suggestions: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          is_validated: boolean | null
          lot_id: string
          taste_profile_id: string | null
          updated_at: string
          user_id: string
          validated_at: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          is_validated?: boolean | null
          lot_id: string
          taste_profile_id?: string | null
          updated_at?: string
          user_id: string
          validated_at?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          is_validated?: boolean | null
          lot_id?: string
          taste_profile_id?: string | null
          updated_at?: string
          user_id?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lia_suggestions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "interencheres_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_suggestions_taste_profile_id_fkey"
            columns: ["taste_profile_id"]
            isOneToOne: false
            referencedRelation: "taste_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memorized_lots: {
        Row: {
          created_at: string
          id: string
          lot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorized_lots_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "interencheres_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_bid_requests: {
        Row: {
          created_at: string
          id: string
          is_confirmed: boolean | null
          lot_id: string
          notes: string | null
          phone_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_confirmed?: boolean | null
          lot_id: string
          notes?: string | null
          phone_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_confirmed?: boolean | null
          lot_id?: string
          notes?: string | null
          phone_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_bid_requests_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "interencheres_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          id: string
          notes: string | null
          sale_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          id?: string
          notes?: string | null
          sale_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          id?: string
          notes?: string | null
          sale_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_appointments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "interencheres_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bank_validated: boolean | null
          bank_validated_at: string | null
          city: string | null
          company: string | null
          contact_preference:
            | Database["public"]["Enums"]["contact_preference"]
            | null
          country: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          id_document_status: string | null
          id_document_uploaded_at: string | null
          id_document_url: string | null
          last_name: string | null
          newsletter_subscribed: boolean | null
          phone: string | null
          postal_code: string | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bank_validated?: boolean | null
          bank_validated_at?: string | null
          city?: string | null
          company?: string | null
          contact_preference?:
            | Database["public"]["Enums"]["contact_preference"]
            | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          id_document_status?: string | null
          id_document_uploaded_at?: string | null
          id_document_url?: string | null
          last_name?: string | null
          newsletter_subscribed?: boolean | null
          phone?: string | null
          postal_code?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bank_validated?: boolean | null
          bank_validated_at?: string | null
          city?: string | null
          company?: string | null
          contact_preference?:
            | Database["public"]["Enums"]["contact_preference"]
            | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          id_document_status?: string | null
          id_document_uploaded_at?: string | null
          id_document_url?: string | null
          last_name?: string | null
          newsletter_subscribed?: boolean | null
          phone?: string | null
          postal_code?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          id: string
          is_confirmed: boolean | null
          lot_id: string
          max_bid: number
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_confirmed?: boolean | null
          lot_id: string
          max_bid: number
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_confirmed?: boolean | null
          lot_id?: string
          max_bid?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "interencheres_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      svv_events: {
        Row: {
          contact_info: string | null
          created_at: string
          description: string | null
          end_date: string | null
          end_time: string | null
          event_type: string
          id: string
          is_active: boolean
          location: string | null
          recurrence_rule: string | null
          specialty: string | null
          start_date: string
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type: string
          id?: string
          is_active?: boolean
          location?: string | null
          recurrence_rule?: string | null
          specialty?: string | null
          start_date: string
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          is_active?: boolean
          location?: string | null
          recurrence_rule?: string | null
          specialty?: string | null
          start_date?: string
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      taste_profiles: {
        Row: {
          alerts_enabled: boolean | null
          ambiances: Json | null
          budget_max: number | null
          budget_min: number | null
          categories: Json | null
          colors: Json | null
          conversation_history: Json | null
          created_at: string
          id: string
          is_complete: boolean | null
          materials: Json | null
          periods: Json | null
          profile_name: string
          styles: Json | null
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean | null
          ambiances?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          categories?: Json | null
          colors?: Json | null
          conversation_history?: Json | null
          created_at?: string
          id?: string
          is_complete?: boolean | null
          materials?: Json | null
          periods?: Json | null
          profile_name?: string
          styles?: Json | null
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean | null
          ambiances?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          categories?: Json | null
          colors?: Json | null
          conversation_history?: Json | null
          created_at?: string
          id?: string
          is_complete?: boolean | null
          materials?: Json | null
          periods?: Json | null
          profile_name?: string
          styles?: Json | null
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          action_type: Database["public"]["Enums"]["lot_action_type"]
          created_at: string
          id: string
          lot_id: string | null
          metadata: Json | null
          sale_id: string | null
          user_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["lot_action_type"]
          created_at?: string
          id?: string
          lot_id?: string | null
          metadata?: Json | null
          sale_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["lot_action_type"]
          created_at?: string
          id?: string
          lot_id?: string | null
          metadata?: Json | null
          sale_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "interencheres_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "interencheres_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      user_alerts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          keyword: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          keyword: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          keyword?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_type: string
          created_at: string
          id: string
          is_accepted: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          specialty: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          specialty: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          specialty?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contact_preference: "email" | "sms"
      lot_action_type:
        | "purchase_order"
        | "phone_bid"
        | "memorize"
        | "info_request"
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
      contact_preference: ["email", "sms"],
      lot_action_type: [
        "purchase_order",
        "phone_bid",
        "memorize",
        "info_request",
      ],
    },
  },
} as const
