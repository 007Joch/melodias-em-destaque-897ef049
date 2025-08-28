import { supabase, supabaseAdmin } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';
import { DEFAULT_VERSE_IMAGE } from '@/constants/images';

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
  estilo: string[];
  natureza: string[];
  dificuldade: number[];
  classificacao_vocal_alt: string[];
  valor: number;
  
  // Conteúdo e mídia
  conteudo: string;
  imageFile?: File;
  imageUrl?: string;
  audioOriginal?: string;
  
  // Propriedades adicionais
  ano_gravacao?: number;
  elenco?: string;
  atualizada_em?: string;
  audio_instrumental?: string;
  audio_original?: string;
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

// Função para redimensionar imagem automaticamente
const resizeImage = (file: File, maxWidth: number = 400, maxHeight: number = 400, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calcular dimensões mantendo proporção
      let { width, height } = img;
      
      // Redimensionar para caber no quadrado mantendo proporção
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      
      // Preencher fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, maxWidth, maxHeight);
      
      // Centralizar imagem
      const x = (maxWidth - width) / 2;
      const y = (maxHeight - height) / 2;
      
      ctx.drawImage(img, x, y, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(resizedFile);
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Função melhorada para fazer upload de imagem para o Supabase Storage
export const uploadImage = async (file: File, fileName: string): Promise<string | null> => {
  try {
    console.log('🔄 Iniciando upload de imagem:', { fileName, fileSize: file.size, fileType: file.type });
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Usuário não autenticado para upload:', authError);
      throw new Error('Usuário deve estar autenticado para fazer upload');
    }
    console.log('✅ Usuário autenticado:', user.id);
    
    // Redimensionar imagem automaticamente
    const resizedFile = await resizeImage(file);
    console.log('📏 Imagem redimensionada:', { newSize: resizedFile.size, newType: resizedFile.type });
    
    // Criar nome único para o arquivo
    const fileExtension = 'jpg';
    const uniqueFileName = `${fileName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    console.log('📁 Nome único do arquivo:', uniqueFileName);
    
    // Fazer upload para o bucket capas
    console.log('📤 Fazendo upload no bucket capas...');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('capas')
      .upload(uniqueFileName, resizedFile, {
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    console.log('✅ Upload realizado com sucesso:', uploadData);
    
    // Obter URL pública da imagem
    const { data } = supabase.storage
      .from('capas')
      .getPublicUrl(uploadData.path);

    console.log('🔗 URL pública gerada:', data.publicUrl);
    
    if (!data.publicUrl) {
      console.error('❌ URL pública não foi gerada');
      throw new Error('Não foi possível gerar URL pública');
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error('❌ Erro geral no upload da imagem:', error);
    throw error;
  }
};

// Variável para controlar se já existe uma operação em andamento
let isCreatingVerse = false;

// Função para criar um novo verso
export const createVerse = async (formData: VerseFormData): Promise<Verse | null> => {
  // Prevenir múltiplas submissões simultâneas
  if (isCreatingVerse) {
    throw new Error('Já existe uma operação de criação em andamento. Aguarde...');
  }
  
  isCreatingVerse = true;
  
  try {
    console.log('🆕 Iniciando criação de verso:', { titulo_pt_br: formData.titulo_pt_br, hasImageFile: !!formData.imageFile, hasImageUrl: !!formData.imageUrl });
    
    // Obter o usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Usuário não autenticado:', authError);
      throw new Error('Usuário deve estar autenticado para criar um verso');
    }

    console.log('✅ Usuário autenticado:', user.id);
    let imageUrl: string | null = null;

    // Se há um arquivo de imagem, fazer upload
    if (formData.imageFile) {
      console.log('📤 Processando upload de arquivo de imagem...');
      const fileName = `verse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const uploadedUrl = await uploadImage(formData.imageFile, fileName);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          console.log('✅ Upload de arquivo concluído:', imageUrl);
        }
      } catch (error) {
        console.error('❌ Falha no upload do arquivo de imagem:', error);
        throw new Error(`Erro no upload da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
    // Se há uma URL de imagem, processar e fazer upload
    else if (formData.imageUrl) {
      console.log('🔗 Processando upload de imagem via URL:', formData.imageUrl);
      try {
        // Baixar a imagem da URL
        const response = await fetch(formData.imageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], 'image_from_url.jpg', { type: 'image/jpeg' });
          
          const fileName = `verse_url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const uploadedUrl = await uploadImage(file, fileName);
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
            console.log('✅ Upload de URL concluído:', imageUrl);
          }
        } else {
          console.warn('⚠️ Não foi possível baixar a imagem da URL fornecida');
          imageUrl = formData.imageUrl; // Fallback para URL original
        }
      } catch (error) {
        console.warn('⚠️ Erro ao processar imagem da URL:', error);
        imageUrl = formData.imageUrl; // Fallback para URL original
      }
    }

    // Processar valor monetário corretamente
    const processedValue = processMonetaryValue(formData.valor);
    
    console.log('💰 Valor processado:', { original: formData.valor, processed: processedValue });

    // Usar apenas o titulo_original fornecido
    const tituloOriginal = formData.titulo_original || formData.titulo_pt_br;
    
    const verseData: VerseInsert = {
      // Campos obrigatórios
      letra_original: formData.letraOriginal || '',
      musical: formData.musical,
      titulo_original: tituloOriginal,
      titulo_pt_br: formData.titulo_pt_br,
      
      // Informações do musical
      compositor: formData.compositor ? [formData.compositor] : null,
      letrista: formData.letrista ? [formData.letrista] : null,
      versionista: formData.versionista ? [formData.versionista] : null,
      revisao: formData.revisao ? [formData.revisao] : null,
      versionado_em: formData.versionadoEm,
      ano_gravacao: formData.ano_gravacao || null,
      elenco: formData.elenco || null,
      
      // Informações do produto
      estilo: formData.estilo && formData.estilo.length > 0 ? formData.estilo : null,
      natureza: formData.natureza && formData.natureza.length > 0 ? formData.natureza : null,
      dificuldade: formData.dificuldade && formData.dificuldade.length > 0 ? formData.dificuldade[0] : null,
      classificacao_vocal_alt: formData.classificacao_vocal_alt && formData.classificacao_vocal_alt.length > 0 ? formData.classificacao_vocal_alt : null,
      valor: processedValue, // Valor processado
      
      // Conteúdo e mídia
      conteudo: formData.conteudo || null,
      url_imagem: imageUrl || null,
      audio_original: formData.audioOriginal || null,
      
      // Versões irmãs
      versoes_irmas: formData.versoes_irmas && formData.versoes_irmas.length > 0 ? formData.versoes_irmas : null,
      
      // Valores padrão
      status: 'active',
      visualizacoes: 0,
      criada_por: user.id
    };

    console.log('📝 Dados finais para inserção:', {
      ...verseData,
      valor: `${processedValue} reais`,
      url_imagem: imageUrl
    });
    
    const { data, error } = await supabase
      .from('versoes')
      .insert(verseData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar verso no Supabase:', error);
      
      if (error.code === '23505') {
        throw new Error('Erro: Já existe um verso com este título. Tente um título diferente.');
      } else if (error.code === '42501' || error.message?.includes('RLS') || error.message?.includes('policy')) {
        throw new Error('Erro de permissão: Você precisa ter um perfil de administrador para criar versos. Faça logout e login novamente.');
      } else {
        throw new Error(`Erro ao salvar verso: ${error.message}`);
      }
    }

    console.log('✅ Verso criado com sucesso:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro geral ao criar verso:', error);
    throw error;
  } finally {
    isCreatingVerse = false;
  }
};

// Função para buscar os últimos versos cadastrados (para seção "Adicionados Recentemente")
export const getRecentVerses = async (limit: number = 3): Promise<any[]> => {
  try {
    console.log(`🆕 Buscando os últimos ${limit} versos versionados`);
    
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active')
      .not('versionado_em', 'is', null)
      .order('versionado_em', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('❌ Erro ao buscar versos recentes:', error);
      throw error;
    }
    
    const processedData = data ? processVerseData(data) : [];
    
    console.log(`✅ Retornando ${processedData.length} versos recentes (ordenados por versionado_em)`);
    
    return processedData;
  } catch (error) {
    console.error('❌ Erro ao buscar versos recentes:', error);
    return [];
  }
};

// Função para buscar versos com paginação (sem cache)
export const getVersesPaginated = async (page: number = 1, limit: number = 50): Promise<{ data: any[], total: number, hasMore: boolean }> => {
  try {
    console.log(`📄 Buscando versos (dados frescos) - Página: ${page}, Limite: ${limit}`);
    
    const offset = (page - 1) * limit;
    
    // Primeiro, buscar o total de registros (forçando dados frescos)
    const { count, error: countError } = await supabase
      .from('versoes')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      throw countError;
    }
    
    const totalRecords = count || 0;
    console.log(`📊 Total de registros na base (dados frescos): ${totalRecords}`);
    
    // Buscar os dados paginados (forçando dados frescos) em ordem alfabética estável
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      // 1) Ordena por titulo_original crescente (nulos por último)
      .order('titulo_original', { ascending: true, nullsFirst: false })
      // 2) Fallback por titulo_pt_br crescente (nulos por último)
      .order('titulo_pt_br', { ascending: true, nullsFirst: false })
      // 3) Desempate estável por id crescente
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('❌ Erro ao buscar versos paginados:', error);
      throw error;
    }
    
    console.log(`🔍 Dados brutos recebidos do Supabase:`, data?.length || 0, 'registros');
    
    const processedData = data ? processVerseData(data) : [];
    const hasMore = offset + limit < totalRecords;
    
    console.log(`📋 Retornando ${processedData.length} versos de ${totalRecords} total. Tem mais: ${hasMore}`);
    
    return {
      data: processedData,
      total: totalRecords,
      hasMore
    };
  } catch (error) {
    console.error('❌ Erro ao buscar versos paginados:', error);
    return { data: [], total: 0, hasMore: false };
  }
};

// Função para buscar todos os versos (mantida para compatibilidade)
export const getAllVerses = async (): Promise<any[]> => {
  try {
    console.log('Buscando todos os versos da tabela versoes...');
    
    // Buscar TODOS os registros sem limitação
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .order('id', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar todos os versos:', error);
      return [];
    }
    
    console.log(`Total de registros encontrados: ${data?.length || 0}`);
    return data ? processVerseData(data) : [];
  } catch (error) {
    console.error('Erro ao buscar versos:', error);
    return [];
  }
};

// Função auxiliar para processar os dados dos versos
const processVerseData = (data: any[]) => {
  console.log('🔄 Processando dados dos versos:', data.length);
  
  // Mapear os dados da tabela versoes para o formato esperado
  const mappedData = data.map(verso => {
    // Determinar a categoria com base apenas na classificacao_vocal_alt
    let category = '';
    if (Array.isArray(verso.classificacao_vocal_alt) && verso.classificacao_vocal_alt.length > 0) {
      category = verso.classificacao_vocal_alt.join(', ');
    }
    
    // Usar valor direto do banco
    const priceInReais = verso.valor || 0;
    
    // Garantir que a URL da imagem seja válida
    let imageUrl = DEFAULT_VERSE_IMAGE;
    if (verso.url_imagem && verso.url_imagem.trim() !== '' && verso.url_imagem !== 'null') {
      imageUrl = verso.url_imagem;
    }
    
    const mapped = {
      id: verso.id,
      // Campos para compatibilidade com o componente MusicCard
      title: verso.titulo_original || verso.titulo_pt_br,
      artist: verso.musical,
      category: category,
      image: imageUrl,
      views: verso.visualizacoes || 0,
      price: priceInReais,
      classificacoes: verso.classificacao_vocal_alt,
      
      // Campos originais da tabela versoes
      titulo_pt_br: verso.titulo_pt_br,
      titulo_original: verso.titulo_original,
      musical: verso.musical,
      estilo: verso.estilo || [],
      natureza: verso.natureza || [],
      dificuldade: verso.dificuldade ? [verso.dificuldade] : [],
      url_imagem: imageUrl,
      visualizacoes: verso.visualizacoes || 0,
      valor: priceInReais,
      status: verso.status || 'active',
      criada_em: verso.criada_em || new Date().toISOString(),
      letra_original: verso.letra_original,
      compositor: verso.compositor,
      letrista: verso.letrista,
      versionista: verso.versionista,
      conteudo: verso.conteudo,
      classificacao_vocal_alt: verso.classificacao_vocal_alt
    };
    
    return mapped;
  });
  
  console.log(`✅ Versos mapeados: ${mappedData.length}`);
  return mappedData;
};

// Função para gerar slug a partir do título - CORRIGIDA
export const generateSlug = (title: string): string => {
  if (!title || title.trim() === '') {
    return '';
  }
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
};

// FUNÇÕES DE BUSCA SIMPLIFICADAS E CORRIGIDAS

// Função para buscar um verso por ID - MELHORADA
export const getVerseById = async (id: number): Promise<Verse | null> => {
  try {
    console.log('🔍 Buscando verso por ID:', id);
    
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar verso por ID:', error);
      return null;
    }

    if (data) {
      console.log('✅ Verso encontrado por ID:', { id: data.id, titulo: data.titulo_pt_br || data.titulo_original });
      return data;
    }

    console.log('❌ Verso não encontrado para ID:', id);
    return null;
  } catch (error) {
    console.error('❌ Erro geral ao buscar verso por ID:', error);
    return null;
  }
};

// Função para buscar um verso por slug - COMPLETAMENTE REESCRITA
export const getVerseBySlug = async (slug: string): Promise<Verse | null> => {
  try {
    console.log('🔍 Buscando verso por slug:', slug);
    
    // Buscar todos os versos (sem filtrar por status) para permitir acesso a versões compradas
    const { data, error } = await supabase
      .from('versoes')
      .select('*'); // Removido filtro de status para permitir acesso a versões compradas mesmo inativas

    if (error) {
      console.error('❌ Erro ao buscar versos para slug:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('❌ Nenhum verso encontrado');
      return null;
    }

    console.log(`📋 Verificando ${data.length} versos para encontrar slug: ${slug}`);

    // Procurar verso que corresponde ao slug
    for (const verse of data) {
      // Tentar com título em português
      if (verse.titulo_pt_br) {
        const slugPtBr = generateSlug(verse.titulo_pt_br);
        console.log(`🔍 Comparando slug "${slug}" com "${slugPtBr}" (título pt-br: "${verse.titulo_pt_br}")`);
        if (slugPtBr === slug) {
          console.log('✅ Verso encontrado por slug (título pt-br):', { id: verse.id, titulo: verse.titulo_pt_br });
          return verse;
        }
      }
      
      // Tentar com título original
      if (verse.titulo_original) {
        const slugOriginal = generateSlug(verse.titulo_original);
        console.log(`🔍 Comparando slug "${slug}" com "${slugOriginal}" (título original: "${verse.titulo_original}")`);
        if (slugOriginal === slug) {
          console.log('✅ Verso encontrado por slug (título original):', { id: verse.id, titulo: verse.titulo_original });
          return verse;
        }
      }
    }

    console.log('❌ Verso não encontrado para slug:', slug);
    return null;
  } catch (error) {
    console.error('❌ Erro geral ao buscar verso por slug:', error);
    return null;
  }
};

// Função principal para buscar verso por ID ou slug - MELHORADA
export const getVerse = async (identifier: string): Promise<Verse | null> => {
  console.log('🔍 Buscando verso com identificador:', identifier);
  
  // Verificar se é um número (ID)
  const id = parseInt(identifier);
  if (!isNaN(id) && id > 0) {
    console.log('📋 Identificador é um ID numérico:', id);
    return await getVerseById(id);
  } else {
    console.log('📋 Identificador é um slug:', identifier);
    return await getVerseBySlug(identifier);
  }
};

// Função para buscar versos por texto
export const searchVerses = async (searchTerm: string, limit: number = 10): Promise<{ exact: Verse | null, similar: Verse[] }> => {
  try {
    console.log(`🔍 Buscando versos com termo: "${searchTerm}"`);
    
    if (!searchTerm.trim()) {
      return { exact: null, similar: [] };
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    
    // 1ª PRIORIDADE: Busca exata no título original
    console.log('🎯 1ª Prioridade: Buscando correspondência exata no título original...');
    const { data: exactOriginalMatches, error: exactOriginalError } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active')
      .ilike('titulo_original', searchTermLower)
      .limit(1);

    if (exactOriginalError) {
      console.error('❌ Erro ao buscar título original exato:', exactOriginalError);
    }

    let exactMatch = exactOriginalMatches && exactOriginalMatches.length > 0 ? exactOriginalMatches[0] : null;
    
    // 2ª PRIORIDADE: Se não encontrou exato no título original, buscar em títulos alternativos
    if (!exactMatch) {
      console.log('🔄 2ª Prioridade: Buscando em títulos alternativos...');
      const { data: allVerses, error: allVersesError } = await supabase
        .from('versoes')
        .select('*')
        .eq('status', 'active')
        .not('titulo_alt', 'is', null);

      if (!allVersesError && allVerses) {
        // Buscar correspondência exata em titulo_alt
        exactMatch = allVerses.find(verse => {
          if (Array.isArray(verse.titulo_alt)) {
            return verse.titulo_alt.some(alt => 
              alt && alt.toLowerCase().trim() === searchTermLower
            );
          }
          return false;
        }) || null;
        
        if (exactMatch) {
          console.log('✅ Encontrado em título alternativo:', exactMatch.titulo_original);
        }
      }
    } else {
      console.log('✅ Encontrado título original exato:', exactMatch.titulo_original);
    }

    // 3ª PRIORIDADE: Busca por musical (agrupamento alfabético)
    console.log('🎭 3ª Prioridade: Verificando busca por musical...');
    const { data: musicalMatches, error: musicalError } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active')
      .ilike('musical', `%${searchTermLower}%`)
      .order('titulo_original', { ascending: true })
      .limit(limit * 2);

    let musicalResults: Verse[] = [];
    if (!musicalError && musicalMatches) {
      // Filtrar resultados do musical, removendo o match exato se existir
      musicalResults = musicalMatches.filter(verse => 
        !exactMatch || verse.id !== exactMatch.id
      );
      console.log(`🎵 Encontrados ${musicalResults.length} resultados por musical`);
    }

    // 4ª PRIORIDADE: Resultados similares (caracteres correspondentes)
    console.log('🔍 4ª Prioridade: Buscando resultados similares...');
    const { data: allVersesForSimilar, error: similarError } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active')
      .limit(limit * 3);

    let similarResults: Verse[] = [];
    if (!similarError && allVersesForSimilar) {
      similarResults = allVersesForSimilar.filter(verse => {
        // Remover o match exato e resultados de musical já incluídos
        if (exactMatch && verse.id === exactMatch.id) return false;
        if (musicalResults.some(mr => mr.id === verse.id)) return false;
        
        // Verificar se contém caracteres correspondentes
        const titleOriginal = (verse.titulo_original || '').toLowerCase();
        const titlePtBr = (verse.titulo_pt_br || '').toLowerCase();
        
        // Verificar titulo_alt (array)
        const titleAltMatch = Array.isArray(verse.titulo_alt) 
          ? verse.titulo_alt.some(alt => 
              alt && alt.toLowerCase().includes(searchTermLower)
            )
          : false;
        
        return titleOriginal.includes(searchTermLower) || 
               titlePtBr.includes(searchTermLower) || 
               titleAltMatch;
      });
      
      console.log(`📝 Encontrados ${similarResults.length} resultados similares`);
    }

    // Combinar resultados: musical + similares, limitando o total
    const combinedSimilar = [...musicalResults, ...similarResults].slice(0, limit);

    console.log(`📊 Resultado final: ${exactMatch ? '1 exato' : '0 exato'}, ${combinedSimilar.length} similares`);
    
    return {
      exact: exactMatch || null,
      similar: combinedSimilar
    };
  } catch (error) {
    console.error('❌ Erro ao buscar versos:', error);
    return { exact: null, similar: [] };
  }
};

// Função para atualizar um verso
export const updateVerse = async (id: number, formData: Partial<VerseFormData>): Promise<Verse | null> => {
  try {
    console.log('Atualizando verso:', id, formData);
    
    let imageUrl = formData.imageUrl;

    // Se há um arquivo de imagem, fazer upload
    if (formData.imageFile) {
      console.log('📤 Processando upload de arquivo de imagem...');
      const fileName = `verse_${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        const uploadedUrl = await uploadImage(formData.imageFile, fileName);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          console.log('✅ Upload de arquivo concluído:', imageUrl);
        }
      } catch (error) {
        console.error('❌ Falha no upload do arquivo de imagem:', error);
        throw new Error(`Erro no upload da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
    // Se há uma URL de imagem e não é do bucket 'capas', processar e fazer upload
    else if (formData.imageUrl && !formData.imageUrl.includes('/capas/')) {
      console.log('🔗 Processando upload de imagem via URL:', formData.imageUrl);
      try {
        // Baixar a imagem da URL
        const response = await fetch(formData.imageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], 'image_from_url.jpg', { type: 'image/jpeg' });
          
          const fileName = `verse_${id}_url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const uploadedUrl = await uploadImage(file, fileName);
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
            console.log('✅ Upload de URL concluído:', imageUrl);
          }
        } else {
          console.warn('⚠️ Não foi possível baixar a imagem da URL fornecida');
          imageUrl = formData.imageUrl; // Fallback para URL original
        }
      } catch (error) {
        console.warn('⚠️ Erro ao processar imagem da URL:', error);
        imageUrl = formData.imageUrl; // Fallback para URL original
      }
    }

    const updateData: VerseUpdate = {};
    
    // Mapear campos do formulário para campos do banco
    if (formData.compositor !== undefined) {
      updateData.compositor = formData.compositor ? [formData.compositor] : null;
    }
    if (formData.letraOriginal !== undefined) {
      updateData.letra_original = formData.letraOriginal || 'Letra não informada';
    }
    if (formData.letrista !== undefined) {
      updateData.letrista = formData.letrista ? [formData.letrista] : null;
    }
    if (formData.versionista !== undefined) {
      updateData.versionista = formData.versionista ? [formData.versionista] : null;
    }
    if (formData.revisao !== undefined) {
      updateData.revisao = formData.revisao ? [formData.revisao] : null;
    }
    if (formData.versionadoEm !== undefined) {
      updateData.versionado_em = formData.versionadoEm || null;
    }
    if (formData.ano_gravacao !== undefined) {
      updateData.ano_gravacao = formData.ano_gravacao || null;
    }
    if (formData.elenco !== undefined) {
      updateData.elenco = formData.elenco || null;
    }
    if (formData.titulo_pt_br !== undefined) {
      updateData.titulo_pt_br = formData.titulo_pt_br || '';
    }
    
    if (formData.titulo_original !== undefined) {
      updateData.titulo_original = formData.titulo_original || updateData.titulo_original;
    }
    if (formData.musical !== undefined) {
      updateData.musical = formData.musical || 'Musical não informado';
    }
    if (formData.estilo !== undefined) {
      updateData.estilo = formData.estilo && formData.estilo.length > 0 ? formData.estilo : null;
    }
    if (formData.natureza !== undefined) {
      updateData.natureza = formData.natureza && formData.natureza.length > 0 ? formData.natureza : null;
    }
    if (formData.dificuldade !== undefined) {
      updateData.dificuldade = formData.dificuldade && formData.dificuldade.length > 0 ? formData.dificuldade[0] : null;
    }
    if (formData.classificacao_vocal_alt !== undefined) {
      updateData.classificacao_vocal_alt = formData.classificacao_vocal_alt && formData.classificacao_vocal_alt.length > 0 ? formData.classificacao_vocal_alt : null;
    }
    if (formData.valor !== undefined) {
      updateData.valor = processMonetaryValue(formData.valor); // Usar valor processado diretamente
    }
    if (formData.conteudo !== undefined) {
      updateData.conteudo = formData.conteudo || null;
    }
    if (imageUrl !== undefined) {
      updateData.url_imagem = imageUrl || null;
    }
    if (formData.audioOriginal !== undefined) {
      updateData.audio_original = formData.audioOriginal || null;
    }
    if (formData.versoes_irmas !== undefined) {
      updateData.versoes_irmas = formData.versoes_irmas && formData.versoes_irmas.length > 0 ? formData.versoes_irmas : null;
    }

    console.log('Valor da imageUrl antes de atualizar:', imageUrl);
    console.log('Dados para atualização:', updateData);

    const { data, error } = await supabase
      .from('versoes')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Erro do Supabase ao atualizar verso:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('Nenhum verso foi atualizado. Verifique se o ID existe:', id);
      throw new Error(`Verso com ID ${id} não encontrado`);
    }

    console.log('Verso atualizado com sucesso:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Erro ao atualizar verso:', error);
    throw error;
  }
};

// Função para deletar um verso
export const deleteVerse = async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ Deletando verso com ID:', id);
    
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      throw new Error('Você precisa estar logado para deletar versos.');
    }

    // Verificar se o usuário tem perfil de admin
    console.log('🔍 Verificando perfil do usuário:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('📋 Resultado da consulta do perfil:', { profile, profileError });

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      throw new Error('Erro ao verificar permissões do usuário.');
    }

    if (!profile || profile.role !== 'admin') {
      console.error('❌ Usuário sem permissão de admin. Profile:', profile);
      console.error('❌ Role encontrado:', profile?.role, 'Esperado: admin');
      throw new Error('Apenas administradores podem deletar versos.');
    }

    console.log('✅ Usuário confirmado como admin:', profile.role);
    
    const { error } = await supabase
      .from('versoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao deletar verso:', error);
      if (error.code === '42501' || error.message?.includes('RLS') || error.message?.includes('policy')) {
        throw new Error('Erro de permissão: Você precisa ter um perfil de administrador para deletar versos. Faça logout e login novamente.');
      }
      throw new Error(`Erro ao deletar verso: ${error.message}`);
    }

    console.log('✅ Verso deletado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar verso:', error);
    throw error;
  }
};

// Função para deletar múltiplos versos
export const deleteMultipleVerses = async (ids: number[]): Promise<boolean> => {
  try {
    console.log('🗑️ Deletando múltiplos versos:', ids);
    
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      throw new Error('Você precisa estar logado para deletar versos.');
    }

    // Verificar se o usuário tem perfil de admin
    console.log('🔍 Verificando perfil do usuário:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('📋 Resultado da consulta do perfil:', { profile, profileError });

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      throw new Error('Erro ao verificar permissões do usuário.');
    }

    if (!profile || profile.role !== 'admin') {
      console.error('❌ Usuário sem permissão de admin. Profile:', profile);
      console.error('❌ Role encontrado:', profile?.role, 'Esperado: admin');
      throw new Error('Apenas administradores podem deletar versos.');
    }

    console.log('✅ Usuário confirmado como admin:', profile.role);
    
    // Deletar um por vez para evitar problemas de RLS
    const errors = [];
    for (const id of ids) {
      try {
        const { error } = await supabase
          .from('versoes')
          .delete()
          .eq('id', id);

        if (error) {
          console.error(`❌ Erro ao deletar verso ${id}:`, error);
          errors.push(`Verso ${id}: ${error.message}`);
        }
      } catch (err) {
        console.error(`❌ Erro geral ao deletar verso ${id}:`, err);
        errors.push(`Verso ${id}: ${err}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Alguns versos não puderam ser deletados: ${errors.join(', ')}`);
    }

    console.log('✅ Múltiplos versos deletados com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar múltiplos versos:', error);
    throw error;
  }
};

// Função para deletar todos os versos
export const deleteAllVerses = async (): Promise<boolean> => {
  try {
    console.log('🗑️ Deletando todos os versos');
    
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      throw new Error('Você precisa estar logado para deletar versos.');
    }

    // Verificar se o usuário tem perfil de admin
    console.log('🔍 Verificando perfil do usuário:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('📋 Resultado da consulta do perfil:', { profile, profileError });

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      throw new Error('Erro ao verificar permissões do usuário.');
    }

    if (!profile || profile.role !== 'admin') {
      console.error('❌ Usuário sem permissão de admin. Profile:', profile);
      console.error('❌ Role encontrado:', profile?.role, 'Esperado: admin');
      throw new Error('Apenas administradores podem deletar versos.');
    }

    console.log('✅ Usuário confirmado como admin:', profile.role);
    
    // Primeiro buscar todos os IDs
    const { data: verses, error: fetchError } = await supabase
      .from('versoes')
      .select('id');

    if (fetchError) {
      console.error('❌ Erro ao buscar versos para deletar:', fetchError);
      throw new Error(`Erro ao buscar versos: ${fetchError.message}`);
    }

    if (!verses || verses.length === 0) {
      console.log('✅ Nenhum verso para deletar');
      return true;
    }

    // Deletar um por vez para evitar problemas de RLS
    const errors = [];
    for (const verse of verses) {
      try {
        const { error } = await supabase
          .from('versoes')
          .delete()
          .eq('id', verse.id);

        if (error) {
          console.error(`❌ Erro ao deletar verso ${verse.id}:`, error);
          errors.push(`Verso ${verse.id}: ${error.message}`);
        }
      } catch (err) {
        console.error(`❌ Erro geral ao deletar verso ${verse.id}:`, err);
        errors.push(`Verso ${verse.id}: ${err}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Alguns versos não puderam ser deletados: ${errors.join(', ')}`);
    }

    console.log('✅ Todos os versos deletados com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar todos os versos:', error);
    throw error;
  }
};



// Função para buscar versos por categoria (usando estilo)
export const getVersesByCategory = async (category: string): Promise<Verse[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .contains('estilo', [category])
      .eq('status', 'active')
      .order('criada_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar versos por categoria:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar versos por categoria:', error);
    return [];
  }
};

// Função para buscar versos por musical
export const getVersesByArtist = async (musical: string): Promise<Verse[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('musical', musical)
      .eq('status', 'active')
      .order('criada_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar versos por musical:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar versos por musical:', error);
    return [];
  }
};

// Função para buscar versos por IDs (versões irmãs)
export const getVersesByIds = async (ids: number[]): Promise<Verse[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .in('id', ids)
      .eq('status', 'active')
      .order('criada_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar versos por IDs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar versos por IDs:', error);
    return [];
  }
};

// Tipo para busca simplificada de versos
export type VerseSearchResult = {
  id: number;
  titulo_original: string | null;
  titulo_pt_br: string;
  musical: string;
};

// Função para buscar versos pelo título original (para versões irmãs)
export const searchVersesByTitle = async (searchTerm: string): Promise<VerseSearchResult[]> => {
  try {
    console.log(`🔍 Iniciando busca por título: "${searchTerm}"`);
    
    const { data, error } = await supabase
      .from('versoes')
      .select('id, titulo_original, titulo_pt_br, musical')
      .ilike('titulo_original', `%${searchTerm}%`)
      .eq('status', 'active')
      .order('titulo_original')
      .limit(20)

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

// Função para buscar versões irmãs por título original
export const searchSisterVerses = async (searchTerm: string, excludeId?: number): Promise<VerseSearchResult[]> => {
  try {
    console.log(`🔍 Buscando versões irmãs para: "${searchTerm}"`);
    
    let query = supabase
      .from('versoes')
      .select('id, titulo_original, titulo_pt_br, musical')
      .ilike('titulo_original', `%${searchTerm}%`)
      .eq('status', 'active')
      .order('titulo_original')
      .limit(10);
    
    // Excluir a versão atual se um ID for fornecido
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar versões irmãs:', error);
      throw error;
    }

    console.log(`✅ Busca de versões irmãs concluída - ${data?.length || 0} resultados encontrados`);
    return data || [];
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar versões irmãs:', error);
    throw error;
  }
};

// Função para buscar categorias únicas
export const getCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('estilo');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }

    // Extrair categorias únicas dos estilos
    const uniqueCategories = Array.from(
      new Set(
        data.flatMap(verse => verse.estilo || [])
      )
    ).filter(Boolean);

    return uniqueCategories;
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
};

// Função para buscar todos os usuários (apenas para admins)
export const getAllUsers = async () => {
  try {
    console.log('🔍 Buscando todos os usuários...');
    
    const { data, error } = await supabase
      .rpc('get_all_profiles_admin');

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return [];
    }

    console.log(`✅ ${data?.length || 0} usuários encontrados`);
    return data || [];
  } catch (error) {
    console.error('❌ Erro geral ao buscar usuários:', error);
    return [];
  }
};

// Função para atualizar o role de um usuário
export const updateUserRole = async (userId: string, newRole: string) => {
  try {
    console.log('🔄 Atualizando role do usuário:', { userId, newRole });
    
    // Usando RPC para atualizar com privilégios administrativos
    const { data, error } = await supabase.rpc('update_user_role_admin', {
      user_id: userId,
      new_role: newRole
    });

    if (error) {
      console.error('❌ Erro ao atualizar role:', error);
      throw error;
    }

    console.log('✅ Role atualizada com sucesso:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro geral ao atualizar role:', error);
    throw error;
  }
};

// Função para atualizar email de um usuário
export const updateUserEmail = async (userId: string, newEmail: string) => {
  try {
    console.log(`📧 Atualizando email do usuário ${userId}...`);
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    );

    if (error) {
      console.error('❌ Erro ao atualizar email:', error);
      throw error;
    }

    console.log('✅ Email atualizado com sucesso');
    return data;
  } catch (error) {
    console.error('❌ Erro geral ao atualizar email:', error);
    throw error;
  }
};

// Função para atualizar senha de um usuário
export const updateUserPassword = async (userId: string, newPassword: string) => {
  try {
    console.log(`🔐 Atualizando senha do usuário ${userId}...`);
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      console.error('❌ Erro ao atualizar senha:', error);
      throw error;
    }

    console.log('✅ Senha atualizada com sucesso');
    return data;
  } catch (error) {
    console.error('❌ Erro geral ao atualizar senha:', error);
    throw error;
  }
};

// Função para atualizar status da conta de um usuário
export const updateUserAccountStatus = async (userId: string, newStatus: string) => {
  try {
    console.log(`🔄 Atualizando status da conta do usuário ${userId} para ${newStatus}...`);
    
    const { data, error } = await supabase.rpc('update_user_account_status', {
      user_id: userId,
      new_status: newStatus
    });

    if (error) {
      console.error('❌ Erro ao atualizar status da conta:', error);
      throw error;
    }

    console.log('✅ Status da conta atualizado com sucesso');
    return data;
  } catch (error) {
    console.error('❌ Erro geral ao atualizar status da conta:', error);
    throw error;
  }
};

// Função para atualizar informações de membresia do usuário
export const updateUserMembership = async (
  userId: string,
  startedAt: string | null,
  expiresAt: string | null,
  lifetime: boolean
) => {
  try {
    console.log(`🔄 Atualizando membresia do usuário ${userId}...`, { startedAt, expiresAt, lifetime });

    const { data, error } = await supabase.rpc('update_user_membership', {
      user_id: userId,
      started_at: startedAt,
      expires_at: expiresAt,
      lifetime
    });

    if (error) {
      console.error('❌ Erro ao atualizar membresia:', error);
      throw error;
    }

    console.log('✅ Membresia atualizada com sucesso');
    return data;
  } catch (error) {
    console.error('❌ Erro geral ao atualizar membresia:', error);
    throw error;
  }
};

 // Função para deletar um usuário
 export const deleteUser = async (userId: string) => {
  try {
    console.log(`🗑️ Deletando usuário ${userId}...`);
    
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('❌ Erro ao deletar usuário:', error);
      throw error;
    }

    console.log('✅ Usuário deletado com sucesso');
    return data;
  } catch (error) {
    console.error('❌ Erro geral ao deletar usuário:', error);
    throw error;
  }
};

// Função para buscar versos relacionados
export const getRelatedVerses = async (verseId: number): Promise<Verse[]> => {
  try {
    console.log('🔍 Buscando versos relacionados para o verso:', verseId);
    
    // Primeiro, buscar o verso atual para obter informações para relacionar
    const { data: currentVerse, error: currentError } = await supabase
      .from('versoes')
      .select('musical, estilo')
      .eq('id', verseId)
      .single();

    if (currentError || !currentVerse) {
      console.log('⚠️ Não foi possível encontrar o verso atual para buscar relacionados');
      return [];
    }

    // Buscar versos do mesmo musical, excluindo o verso atual
    const { data: relatedVerses, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('musical', currentVerse.musical)
      .neq('id', verseId)
      .eq('status', 'active')
      .limit(6);

    if (error) {
      console.error('❌ Erro ao buscar versos relacionados:', error);
      return [];
    }

    console.log('✅ Versos relacionados encontrados:', relatedVerses?.length || 0);
    return relatedVerses || [];
  } catch (error) {
    console.error('❌ Erro geral ao buscar versos relacionados:', error);
    return [];
  }
};
