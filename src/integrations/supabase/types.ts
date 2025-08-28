export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          bairro: string
          cep: string
          cidade: string
          complemento: string | null
          created_at: string | null
          estado: string
          id: string
          is_default: boolean | null
          numero: string
          rua: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bairro: string
          cep: string
          cidade: string
          complemento?: string | null
          created_at?: string | null
          estado: string
          id?: string
          is_default?: boolean | null
          numero: string
          rua: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bairro?: string
          cep?: string
          cidade?: string
          complemento?: string | null
          created_at?: string | null
          estado?: string
          id?: string
          is_default?: boolean | null
          numero?: string
          rua?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: Json
          created_at: string | null
          id: string
          items: Json
          payment_id: string
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address: Json
          created_at?: string | null
          id?: string
          items: Json
          payment_id: string
          status?: string
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: Json
          created_at?: string | null
          id?: string
          items?: Json
          payment_id?: string
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_percent: number
          expires_at: string | null
          enabled: boolean
          usage_limit: number | null
          usage_count: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          code: string
          discount_percent: number
          expires_at?: string | null
          enabled?: boolean
          usage_limit?: number | null
          usage_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          discount_percent?: number
          expires_at?: string | null
          enabled?: boolean
          usage_limit?: number | null
          usage_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          blocked_reason: string | null
          blocked_until: string | null
          cpf: string | null
          created_at: string | null
          endereco: Json | null
          failed_login_attempts: number | null
          id: string
          last_failed_login: string | null
          name: string
          role: string | null
          telefone: string | null
          updated_at: string | null
          membership_started_at: string | null
          membership_expires_at: string | null
          membership_lifetime: boolean | null
        }
        Insert: {
          account_status?: string | null
          blocked_reason?: string | null
          blocked_until?: string | null
          cpf?: string | null
          created_at?: string | null
          endereco?: Json | null
          failed_login_attempts?: number | null
          id: string
          last_failed_login?: string | null
          name: string
          role?: string | null
          telefone?: string | null
          updated_at?: string | null
          membership_started_at?: string | null
          membership_expires_at?: string | null
          membership_lifetime?: boolean | null
        }
        Update: {
          account_status?: string | null
          blocked_reason?: string | null
          blocked_until?: string | null
          cpf?: string | null
          created_at?: string | null
          endereco?: Json | null
          failed_login_attempts?: number | null
          id?: string
          last_failed_login?: string | null
          name?: string
          role?: string | null
          telefone?: string | null
          updated_at?: string | null
          membership_started_at?: string | null
          membership_expires_at?: string | null
          membership_lifetime?: boolean | null
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_id: string | null
          payment_method: string
          payment_status: string
          updated_at: string | null
          user_id: string
          verse_id: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_id?: string | null
          payment_method: string
          payment_status?: string
          updated_at?: string | null
          user_id: string
          verse_id: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_id?: string | null
          payment_method?: string
          payment_status?: string
          updated_at?: string | null
          user_id?: string
          verse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes: {
        Row: {
          id: string
          user_id: string
          note_date: string
          title: string
          content: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          note_date: string
          title: string
          content: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          note_date?: string
          title?: string
          content?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      versoes: {
        Row: {
          ano_gravacao: number | null
          atualizada_em: string | null
          audio_instrumental: string[] | null
          audio_original: string | null
          classificacao_vocal_alt: string[] | null
          compositor: string[] | null
          compras: number | null
          conteudo: string | null
          coro_feminino: boolean | null
          coro_masculino: boolean | null
          criada_em: string | null
          criada_por: string | null
          dificuldade: number | null
          elenco: string | null
          estilo: string[] | null
          id: number
          letra_original: string
          letrista: string[] | null
          musical: string
          musical_alt: string[] | null
          natureza: string[] | null
          origem: string | null
          pdf: string | null
          revisao: string[] | null
          solistas_femininos: number | null
          solistas_masculinos: number | null
          status: string | null
          titulo_alt: string[] | null
          titulo_original: string
          titulo_pt_br: string
          url_imagem: string | null
          valor: number | null
          versao_brasileira: string | null
          versionado_em: string | null
          versionista: string[] | null
          versoes_irmas: number[] | null
          visualizacoes: number | null
        }
        Insert: {
          ano_gravacao?: number | null
          atualizada_em?: string | null
          audio_instrumental?: string[] | null
          audio_original?: string | null
          classificacao_vocal_alt?: string[] | null
          compositor?: string[] | null
          compras?: number | null
          conteudo?: string | null
          coro_feminino?: boolean | null
          coro_masculino?: boolean | null
          criada_em?: string | null
          criada_por?: string | null
          dificuldade?: number | null
          elenco?: string | null
          estilo?: string[] | null
          id?: number
          letra_original: string
          letrista?: string[] | null
          musical: string
          musical_alt?: string[] | null
          natureza?: string[] | null
          origem?: string | null
          pdf?: string | null
          revisao?: string[] | null
          solistas_femininos?: number | null
          solistas_masculinos?: number | null
          status?: string | null
          titulo_alt?: string[] | null
          titulo_original: string
          titulo_pt_br: string
          url_imagem?: string | null
          valor?: number | null
          versao_brasileira?: string | null
          versionado_em?: string | null
          versionista?: string[] | null
          versoes_irmas?: number[] | null
          visualizacoes?: number | null
        }
        Update: {
          ano_gravacao?: number | null
          atualizada_em?: string | null
          audio_instrumental?: string[] | null
          audio_original?: string | null
          classificacao_vocal_alt?: string[] | null
          compositor?: string[] | null
          compras?: number | null
          conteudo?: string | null
          coro_feminino?: boolean | null
          coro_masculino?: boolean | null
          criada_em?: string | null
          criada_por?: string | null
          dificuldade?: number | null
          elenco?: string | null
          estilo?: string[] | null
          id?: number
          letra_original?: string
          letrista?: string[] | null
          musical?: string
          musical_alt?: string[] | null
          natureza?: string[] | null
          origem?: string | null
          pdf?: string | null
          revisao?: string[] | null
          solistas_femininos?: number | null
          solistas_masculinos?: number | null
          status?: string | null
          titulo_alt?: string[] | null
          titulo_original?: string
          titulo_pt_br?: string
          url_imagem?: string | null
          valor?: number | null
          versao_brasileira?: string | null
          versionado_em?: string | null
          versionista?: string[] | null
          versoes_irmas?: number[] | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_basic_profile: {
        Args: { user_id: string; user_name: string }
        Returns: {
          account_status: string | null
          blocked_reason: string | null
          blocked_until: string | null
          cpf: string | null
          created_at: string | null
          endereco: Json | null
          failed_login_attempts: number | null
          id: string
          last_failed_login: string | null
          name: string
          role: string | null
          telefone: string | null
          updated_at: string | null
        }
      }
      get_all_profiles_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          role: string
          created_at: string
          updated_at: string
          cpf: string
          telefone: string
          endereco: Json
        }[]
      }
      get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          name: string
          telefone: string
          role: string
          created_at: string
          avatar_url: string
          address: string
          account_status: string
          failed_login_attempts: number
          blocked_until: string
        }[]
      }
      get_all_users_with_auth_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          role: string
          created_at: string
          updated_at: string
          cpf: string
          telefone: string
          endereco: Json
          email: string
          email_confirmed_at: string
          last_sign_in_at: string
        }[]
      }
      get_user_email: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: {
          account_status: string | null
          blocked_reason: string | null
          blocked_until: string | null
          cpf: string | null
          created_at: string | null
          endereco: Json | null
          failed_login_attempts: number | null
          id: string
          last_failed_login: string | null
          name: string
          role: string | null
          telefone: string | null
          updated_at: string | null
        }
      }
      increment_failed_login_attempts: {
        Args: { user_id: string; block_until?: string }
        Returns: boolean
      }
      reset_failed_login_attempts: {
        Args: { user_id: string }
        Returns: boolean
      }
      update_account_status: {
        Args: { user_id: string; new_status: string; reason?: string }
        Returns: boolean
      }
      update_user_role_admin: {
        Args: { user_id: string; new_role: string }
        Returns: Json
      }
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
  DefaultSchemaCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends DefaultSchemaCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = DefaultSchemaCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : DefaultSchemaCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][DefaultSchemaCompositeTypeNameOrOptions]
    : never
