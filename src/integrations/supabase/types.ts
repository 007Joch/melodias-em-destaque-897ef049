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
          id: string
          name: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      verses: {
        Row: {
          artist: string
          category: string
          compositor: string
          conteudo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: number
          image_url: string | null
          letra_original: string | null
          letrista: string | null
          origem: string
          revisao: string | null
          status: string | null
          titulo_pt_br: string
          updated_at: string | null
          versionado_em: string
          versionista: string | null
          views: number | null
          youtube_url: string | null
        }
        Insert: {
          artist: string
          category: string
          compositor: string
          conteudo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: number
          image_url?: string | null
          letra_original?: string | null
          letrista?: string | null
          origem: string
          revisao?: string | null
          status?: string | null
          titulo_pt_br: string
          updated_at?: string | null
          versionado_em: string
          versionista?: string | null
          views?: number | null
          youtube_url?: string | null
        }
        Update: {
          artist?: string
          category?: string
          compositor?: string
          conteudo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: number
          image_url?: string | null
          letra_original?: string | null
          letrista?: string | null
          origem?: string
          revisao?: string | null
          status?: string | null
          titulo_pt_br?: string
          updated_at?: string | null
          versionado_em?: string
          versionista?: string | null
          views?: number | null
          youtube_url?: string | null
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
