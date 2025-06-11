
import { supabase } from '@/integrations/supabase/client';

// Interface para a estrutura da tabela versoes
interface VerseData {
  id: number;
  titulo_pt_br: string;
  titulo_original: string;
  musical: string;
  estilo: string[];
  dificuldade: number;
  valor: number;
  url_imagem: string;
  status: string;
  criada_em: string;
  atualizada_em: string;
  ano_gravacao?: number;
  audio_instrumental?: string[];
  audio_original?: string;
  elenco?: string;
  conteudo?: string;
  visualizacoes?: number;
  compras?: number;
  compositor?: string[];
  letrista?: string[];
  versionista?: string[];
  revisao?: string[];
  letra_original?: string;
  pdf?: string;
  versionado_em?: string;
  criada_por?: string;
  origem?: string;
  natureza?: string[];
  musical_alt?: string[];
  titulo_alt?: string[];
  classificacao_vocal_alt?: string[];
  solistas_masculinos?: number;
  solistas_femininos?: number;
  coro_masculino?: boolean;
  coro_feminino?: boolean;
  versoes_irmas?: string[];
}

// Interface para exibição no frontend
export interface Verse {
  id: number;
  title: string;
  artist: string;
  category: string;
  image?: string;
  price: number;
  description?: string;
  difficulty?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

const mapVerseData = (data: VerseData): Verse => {
  return {
    id: data.id,
    title: data.titulo_pt_br,
    artist: data.musical,
    category: Array.isArray(data.estilo) ? data.estilo.join(', ') : (data.estilo || 'Musical'),
    image: data.url_imagem,
    price: data.valor || 0,
    description: data.titulo_original,
    difficulty: data.dificuldade,
    status: data.status,
    createdAt: data.criada_em,
    updatedAt: data.atualizada_em
  };
};

export const getVerses = async (
  searchTerm: string = '',
  musicalFilter: string = 'all',
  styleFilter: string = 'all',
  difficultyFilter: string = 'all',
  page: number = 1,
  limit: number = 50
): Promise<Verse[]> => {
  try {
    console.log('Iniciando busca de versos...');
    
    let query = supabase
      .from('versoes')
      .select('*')
      .order('versionado_em', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (searchTerm) {
      query = query.or(`titulo_pt_br.ilike.%${searchTerm}%,titulo_original.ilike.%${searchTerm}%,musical.ilike.%${searchTerm}%`);
    }

    if (musicalFilter && musicalFilter !== 'all') {
      query = query.eq('musical', musicalFilter);
    }

    if (styleFilter && styleFilter !== 'all') {
      query = query.contains('estilo', [styleFilter]);
    }

    if (difficultyFilter && difficultyFilter !== 'all') {
      query = query.eq('dificuldade', parseInt(difficultyFilter));
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro na query do Supabase:', error);
      throw error;
    }

    console.log(`🔍 Dados brutos recebidos do Supabase: ${data?.length || 0} registros`);

    if (!data) {
      console.log('❌ Nenhum dado retornado do Supabase');
      return [];
    }

    console.log('🔄 Processando dados dos versos:', data.length);
    const mappedVerses = data.map(mapVerseData);
    console.log('✅ Versos mapeados:', mappedVerses.length);

    const hasMore = data.length === limit;
    console.log(`📋 Retornando ${mappedVerses.length} versos de ${count || 'desconhecido'} total. Tem mais: ${hasMore}`);

    return mappedVerses;
  } catch (error) {
    console.error('Erro ao buscar versos:', error);
    throw error;
  }
};

export const getRecentVerses = async (limit: number = 3): Promise<Verse[]> => {
  try {
    console.log(`🆕 Buscando os últimos ${limit} versos versionados`);
    
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .not('versionado_em', 'is', null)
      .order('versionado_em', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar versos recentes:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('❌ Nenhum verso recente encontrado');
      return [];
    }

    const mappedVerses = data.map(mapVerseData);
    console.log(`✅ Retornando ${mappedVerses.length} versos recentes (ordenados por versionado_em)`);
    
    return mappedVerses;
  } catch (error) {
    console.error('Erro ao buscar versos recentes:', error);
    throw error;
  }
};

export const getVerseById = async (id: number): Promise<VerseData | null> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar verso por ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar verso:', error);
    throw error;
  }
};

export const deleteVerse = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('versoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir verso:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao excluir verso:', error);
    throw error;
  }
};

export const createVerse = async (verseData: Partial<VerseData>): Promise<VerseData> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .insert([verseData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar verso:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar verso:', error);
    throw error;
  }
};

export const updateVerse = async (id: number, verseData: Partial<VerseData>): Promise<VerseData> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .update(verseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar verso:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar verso:', error);
    throw error;
  }
};

export const getMusicals = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('musical')
      .not('musical', 'is', null);

    if (error) {
      console.error('Erro ao buscar musicais:', error);
      throw error;
    }

    const uniqueMusicals = [...new Set(data?.map(item => item.musical) || [])];
    return uniqueMusicals.sort();
  } catch (error) {
    console.error('Erro ao buscar musicais:', error);
    throw error;
  }
};

export const getStyles = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('estilo')
      .not('estilo', 'is', null);

    if (error) {
      console.error('Erro ao buscar estilos:', error);
      throw error;
    }

    const allStyles: string[] = [];
    data?.forEach(item => {
      if (Array.isArray(item.estilo)) {
        allStyles.push(...item.estilo);
      }
    });

    const uniqueStyles = [...new Set(allStyles)];
    return uniqueStyles.sort();
  } catch (error) {
    console.error('Erro ao buscar estilos:', error);
    throw error;
  }
};
