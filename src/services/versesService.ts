import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';

export type Verse = Database['public']['Tables']['versoes']['Row'];
type VerseInsert = Database['public']['Tables']['versoes']['Insert'];
type VerseUpdate = Database['public']['Tables']['versoes']['Update'];

export interface VerseFormData {
  // Informações do Musical
  compositor: string;
  letraOriginal: string;
  letrista: string;
  versionista: string;
  revisao: string;
  versionadoEm: string;
  
  // Informações do Produto
  titulo_pt_br: string;
  titulo_original?: string;
  musical: string;
  estilo: string;
  valor: number;
  
  // Conteúdo e mídia
  conteudo: string;
  imageFile?: File;
  imageUrl?: string;
  audioOriginal?: string;
  
  // Versões irmãs
  versoes_irmas?: number[];
}

// Função para processar e formatar valores monetários
export const processMonetaryValue = (value: string | number): number => {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove espaços e caracteres não numéricos exceto vírgula e ponto
    let cleanValue = value.replace(/[^\d,.-]/g, '');
    
    // Substitui vírgula por ponto para padronizar
    cleanValue = cleanValue.replace(',', '.');
    
    // Converte para número
    const numericValue = parseFloat(cleanValue) || 0;
    
    console.log('💰 Processando valor monetário:', { original: value, clean: cleanValue, final: numericValue });
    
    return numericValue;
  }
  
  return 0;
};

// Função para buscar versos pelo título original (para versões irmãs) - CORRIGIDA
export const searchVersesByTitle = async (searchTerm: string): Promise<Pick<Verse, 'id' | 'titulo_original' | 'titulo_pt_br' | 'musical'>[]> => {
  try {
    console.log(`🔍 Iniciando busca por título: "${searchTerm}"`);
    
    const { data, error } = await supabase
      .from('versoes')
      .select('id, titulo_original, titulo_pt_br, musical')
      .ilike('titulo_original', `%${searchTerm}%`)
      .eq('status', 'active')
      .order('titulo_original')
      .limit(20);

    if (error) {
      console.error('❌ Erro ao buscar versos por título:', error);
      throw error;
    }

    console.log(`✅ Busca concluída para "${searchTerm}" - ${data?.length || 0} resultados encontrados`);
    return data || [];
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar versos por título:', error);
    throw error;
  }
};

// Função auxiliar para redimensionar imagem
const resizeImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const resizedFile = new File([blob!], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(resizedFile);
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Função para fazer upload de imagem
const uploadImage = async (file: File): Promise<string | null> => {
  try {
    console.log('📤 Iniciando upload da imagem:', file.name);
    
    // Redimensionar a imagem antes do upload
    const resizedFile = await resizeImage(file);
    console.log('🖼️ Imagem redimensionada:', {
      original: `${file.size} bytes`,
      resized: `${resizedFile.size} bytes`
    });
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `verses/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, resizedFile);

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log('✅ Upload concluído:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Erro no upload da imagem:', error);
    return null;
  }
};

// Função para criar novo verso
export const createVerse = async (verseData: VerseFormData): Promise<boolean> => {
  try {
    console.log('📝 Iniciando criação de verso...');

    let imageUrl = verseData.imageUrl || '';
    
    // Upload da imagem se fornecida
    if (verseData.imageFile) {
      const uploadedUrl = await uploadImage(verseData.imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    // Preparar dados para inserção
    const insertData: VerseInsert = {
      titulo_pt_br: verseData.titulo_pt_br,
      titulo_original: verseData.titulo_original || verseData.titulo_pt_br,
      musical: verseData.musical,
      letra_original: verseData.letraOriginal,
      compositor: verseData.compositor ? [verseData.compositor] : [],
      letrista: verseData.letrista ? [verseData.letrista] : [],
      versionista: verseData.versionista ? [verseData.versionista] : [],
      revisao: verseData.revisao ? [verseData.revisao] : [],
      estilo: verseData.estilo ? [verseData.estilo] : [],
      valor: processMonetaryValue(verseData.valor),
      conteudo: verseData.conteudo,
      url_imagem: imageUrl,
      audio_original: verseData.audioOriginal || null,
      versionado_em: verseData.versionadoEm ? new Date(verseData.versionadoEm).toISOString().split('T')[0] : null,
      versoes_irmas: verseData.versoes_irmas || [],
      status: 'active',
      visualizacoes: 0,
      compras: 0
    };

    console.log('📄 Dados preparados para inserção:', insertData);

    const { data, error } = await supabase
      .from('versoes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar verso:', error);
      throw error;
    }

    console.log('✅ Verso criado com sucesso:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro na criação do verso:', error);
    throw error;
  }
};

export const getRecentVerses = async (limit: number = 12): Promise<Verse[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active')
      .order('criada_em', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar versos recentes:', error);
    return [];
  }
};

export const getVersesPaginated = async (page: number = 1, limit: number = 50) => {
  try {
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('versoes')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('criada_em', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
      page,
      limit
    };
  } catch (error) {
    console.error('Erro ao buscar versos paginados:', error);
    return { data: [], total: 0, hasMore: false, page, limit };
  }
};

export const getAllVerses = async (): Promise<Verse[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active')
      .order('titulo_pt_br');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar todos os versos:', error);
    return [];
  }
};

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const getVerseById = async (id: number): Promise<Verse | null> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar verso por ID:', error);
    return null;
  }
};

export const getVerseBySlug = async (slug: string): Promise<Verse | null> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    const verse = data?.find(v => generateSlug(v.titulo_pt_br) === slug);
    return verse || null;
  } catch (error) {
    console.error('Erro ao buscar verso por slug:', error);
    return null;
  }
};

export const getVerse = async (identifier: string | number): Promise<Verse | null> => {
  if (typeof identifier === 'number') {
    return getVerseById(identifier);
  } else {
    return getVerseBySlug(identifier);
  }
};

export const searchVerses = async (query: string): Promise<Verse[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active')
      .or(`titulo_pt_br.ilike.%${query}%,titulo_original.ilike.%${query}%,musical.ilike.%${query}%`)
      .order('titulo_pt_br');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro na busca de versos:', error);
    return [];
  }
};

export const updateVerse = async (id: number, updates: Partial<VerseUpdate>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('versoes')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar verso:', error);
    return false;
  }
};

export const deleteVerse = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('versoes')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir verso:', error);
    return false;
  }
};

export const incrementViews = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_views', { verse_id: id });
    if (error) console.error('Erro ao incrementar visualizações:', error);
  } catch (error) {
    console.error('Erro ao incrementar visualizações:', error);
  }
};

export const getVersesByCategory = async (category: string): Promise<Verse[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active')
      .contains('estilo', [category])
      .order('titulo_pt_br');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar versos por categoria:', error);
    return [];
  }
};

export const getVersesByArtist = async (artist: string): Promise<Verse[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active')
      .ilike('musical', `%${artist}%`)
      .order('titulo_pt_br');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar versos por artista:', error);
    return [];
  }
};

export const getVersesByIds = async (ids: number[]): Promise<Verse[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .in('id', ids)
      .eq('status', 'active');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar versos por IDs:', error);
    return [];
  }
};

export const getCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('estilo')
      .eq('status', 'active');

    if (error) throw error;

    const categories = new Set<string>();
    data?.forEach(verse => {
      if (verse.estilo && Array.isArray(verse.estilo)) {
        verse.estilo.forEach(style => categories.add(style));
      }
    });

    return Array.from(categories).sort();
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
};
