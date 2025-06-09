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
        cacheControl: '3600',
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
    const valueInCents = Math.round(processedValue * 100); // Converter para centavos
    
    console.log('💰 Valor processado:', { original: formData.valor, processed: processedValue, inCents: valueInCents });

    // Usar o titulo_original fornecido ou o titulo_pt_br como fallback
    const tituloOriginal = formData.titulo_original || formData.titulo_pt_br;
    
    const verseData: VerseInsert = {
      // Campos obrigatórios
      letra_original: formData.letraOriginal || 'Letra original não informada',
      musical: formData.musical,
      titulo_original: tituloOriginal,
      titulo_pt_br: formData.titulo_pt_br,
      
      // Informações do musical
      compositor: formData.compositor ? [formData.compositor] : null,
      letrista: formData.letrista ? [formData.letrista] : null,
      versionista: formData.versionista ? [formData.versionista] : null,
      revisao: formData.revisao ? [formData.revisao] : null,
      versionado_em: formData.versionadoEm,
      
      // Informações do produto
      estilo: formData.estilo ? [formData.estilo] : null,
      valor: valueInCents, // Valor em centavos
      
      // Conteúdo e mídia
      conteudo: formData.conteudo,
      url_imagem: imageUrl || null,
      audio_original: formData.audioOriginal || null,
      
      // Valores padrão
      status: 'active',
      visualizacoes: 0,
      criada_por: user.id
    };

    console.log('📝 Dados finais para inserção:', {
      ...verseData,
      valor: `${processedValue} reais (${valueInCents} centavos)`,
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

// Função para buscar versos com paginação
export const getVersesPaginated = async (page: number = 1, limit: number = 50): Promise<{ data: any[], total: number, hasMore: boolean }> => {
  try {
    console.log(`📄 Buscando versos - Página: ${page}, Limite: ${limit}`);
    
    const offset = (page - 1) * limit;
    
    // Primeiro, buscar o total de registros
    const { count, error: countError } = await supabase
      .from('versoes')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      throw countError;
    }
    
    const totalRecords = count || 0;
    console.log(`📊 Total de registros na base: ${totalRecords}`);
    
    // Buscar os dados paginados
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('❌ Erro ao buscar versos paginados:', error);
      throw error;
    }
    
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
    console.log('Buscando todos os versos ativos da tabela versoes...');
    
    // Buscar apenas os primeiros registros para garantir que algo seja retornado
    const { data: simpleData, error: simpleError } = await supabase
      .from('versoes')
      .select('*')
      .range(0, 49);
      
    if (simpleError) {
      console.error('Erro na busca simples:', simpleError);
      return [];
    } else {
      console.log(`Registros encontrados na busca simples: ${simpleData?.length || 0}`);
      if (simpleData && simpleData.length > 0) {
        return processVerseData(simpleData);
      }
    }
    
    return [];
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
    // Determinar a categoria com base no estilo
    let category = 'Teatro Musical';
    if (Array.isArray(verso.estilo) && verso.estilo.length > 0) {
      category = verso.estilo[0];
    }
    
    // Converter valor de centavos para reais
    const priceInReais = verso.valor ? verso.valor / 100 : 0;
    
    // Garantir que a URL da imagem seja válida
    let imageUrl = '/musical-generic.svg';
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
    
    // Buscar todos os versos ativos
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('❌ Erro ao buscar versos para slug:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('❌ Nenhum verso ativo encontrado');
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
    console.log(`Buscando versos com termo: "${searchTerm}"`);
    
    if (!searchTerm.trim()) {
      return { exact: null, similar: [] };
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    
    // Buscar verso exato por título
    const { data: exactMatch, error: exactError } = await supabase
      .from('versoes')
      .select('*')
      .or(`titulo_original.ilike."${searchTermLower}",titulo_pt_br.ilike."${searchTermLower}"`)
      .limit(1)
      .single();

    if (exactError && exactError.code !== 'PGRST116') {
      console.error('Erro ao buscar verso exato:', exactError);
    }

    // Buscar versos similares
    const { data: similarMatches, error: similarError } = await supabase
      .from('versoes')
      .select('*')
      .or(`titulo_original.ilike."%${searchTermLower}%",titulo_pt_br.ilike."%${searchTermLower}%",musical.ilike."%${searchTermLower}%",compositor.ilike."%${searchTermLower}%",conteudo.ilike."%${searchTermLower}%"`)
      .limit(limit)
      .order('visualizacoes', { ascending: false });

    if (similarError) {
      console.error('Erro ao buscar versos similares:', similarError);
      return { exact: exactMatch || null, similar: [] };
    }

    // Filtrar o resultado exato dos similares para evitar duplicação
    const filteredSimilar = similarMatches?.filter(verse => 
      exactMatch ? verse.id !== exactMatch.id : true
    ) || [];

    console.log(`Encontrados: ${exactMatch ? '1 exato' : '0 exato'}, ${filteredSimilar.length} similares`);
    
    return {
      exact: exactMatch || null,
      similar: filteredSimilar
    };
  } catch (error) {
    console.error('Erro ao buscar versos:', error);
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
    if (formData.titulo_pt_br !== undefined) {
      updateData.titulo_pt_br = formData.titulo_pt_br || 'Título não informado';
    }
    
    if (formData.titulo_original !== undefined) {
      updateData.titulo_original = formData.titulo_original || updateData.titulo_original;
    }
    if (formData.musical !== undefined) {
      updateData.musical = formData.musical || 'Musical não informado';
    }
    if (formData.estilo !== undefined) {
      updateData.estilo = formData.estilo ? [formData.estilo] : null;
    }
    if (formData.valor !== undefined) {
      updateData.valor = Math.round((typeof formData.valor === 'string' ? parseFloat(formData.valor) || 0 : formData.valor || 0) * 100); // Converter para centavos (inteiro)
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
    const { error } = await supabase
      .from('versoes')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao deletar verso:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar verso:', error);
    return false;
  }
};

// Função para incrementar visualizações
export const incrementViews = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_verse_views', { verse_id: id });
    
    if (error) {
      // Fallback: buscar o verso atual e incrementar manualmente
      const verse = await getVerseById(id);
      if (verse) {
        await supabase
          .from('versoes')
          .update({ visualizacoes: (verse.visualizacoes || 0) + 1 })
          .eq('id', id);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao incrementar visualizações:', error);
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
