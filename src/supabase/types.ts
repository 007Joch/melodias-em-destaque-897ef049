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
          cpf: string | null
          created_at: string | null
          endereco: Json | null
          id: string
          name: string
          role: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          endereco?: Json | null
          id: string
          name: string
          role?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          endereco?: Json | null
          id?: string
          name?: string
          role?: string | null
          telefone?: string | null
          updated_at?: string | null
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
      versoes_BACKUP: {
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
          cpf: string | null
          created_at: string | null
          endereco: Json | null
          id: string
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
          email_confirmed_at: string
          created_at: string
          updated_at: string
          last_sign_in_at: string
          raw_user_meta_data: Json
          profile_name: string
          profile_role: string
          profile_cpf: string
          profile_telefone: string
          profile_endereco: string
          profile_created_at: string
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
          cpf: string | null
          created_at: string | null
          endereco: Json | null
          id: string
          name: string
          role: string | null
          telefone: string | null
          updated_at: string | null
        }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never