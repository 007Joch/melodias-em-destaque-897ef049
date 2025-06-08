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

// Função para fazer upload de imagem para o Supabase Storage
export const uploadImage = async (file: File, fileName: string): Promise<string | null> => {
  try {
    console.log('Iniciando upload de imagem:', { fileName, fileSize: file.size, fileType: file.type });
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Usuário não autenticado para upload:', authError);
      return null;
    }
    console.log('Usuário autenticado:', user.id);
    
    // Redimensionar imagem automaticamente
    const resizedFile = await resizeImage(file);
    console.log('Imagem redimensionada:', { newSize: resizedFile.size, newType: resizedFile.type });
    
    const filePath = `capas/${fileName}.jpg`; // Sempre salvar como JPG
    console.log('Caminho do arquivo:', filePath);

    console.log('Tentando fazer upload para:', filePath);
    console.log('Tamanho do arquivo redimensionado:', resizedFile.size);
    console.log('Tipo do arquivo:', resizedFile.type);
    
    // Tentar upload com nome único para evitar conflitos
    const uniqueFilePath = `${fileName}_${Date.now()}.jpg`;
    console.log('Caminho único do arquivo:', uniqueFilePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('capas')
      .upload(uniqueFilePath, resizedFile, {
        cacheControl: '3600',
        upsert: false
      });
      
    // Atualizar filePath para o caminho único usado
    const finalFilePath = uniqueFilePath;

    if (uploadError) {
      console.error('Erro detalhado no upload:', {
        message: uploadError.message,
        details: uploadError
      });
      return null;
    }

    console.log('Upload realizado com sucesso:', uploadData);
    
    // Verificar se o upload realmente foi bem-sucedido
    if (!uploadData || !uploadData.path) {
      console.error('Upload falhou: dados de upload inválidos');
      return null;
    }

    // Obter URL pública da imagem usando o path retornado pelo upload
    const { data } = supabase.storage
      .from('capas')
      .getPublicUrl(uploadData.path);

    console.log('URL pública gerada:', data.publicUrl);
    console.log('Verificando se URL é válida:', data.publicUrl.includes('supabase'));
    
    // Verificar se a URL foi gerada corretamente
    if (!data.publicUrl) {
      console.error('URL pública não foi gerada');
      return null;
    }
    
    console.log('URL pública válida gerada:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Erro geral no upload da imagem:', error);
    return null;
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
    console.log('Iniciando criação de verso:', { titulo_pt_br: formData.titulo_pt_br, hasImageFile: !!formData.imageFile, hasImageUrl: !!formData.imageUrl });
    
    // Obter o usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Usuário não autenticado:', authError);
      throw new Error('Usuário deve estar autenticado para criar um verso');
    }

    console.log('Usuário autenticado:', user.id);
    let imageUrl: string | null = null;

    // Se há um arquivo de imagem, fazer upload
    if (formData.imageFile) {
      console.log('Processando upload de arquivo de imagem...', {
        fileName: formData.imageFile.name,
        fileSize: formData.imageFile.size,
        fileType: formData.imageFile.type
      });
      const fileName = `verse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Nome do arquivo gerado:', fileName);
      const uploadedUrl = await uploadImage(formData.imageFile, fileName);
      console.log('Resultado do upload:', uploadedUrl);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
        console.log('Upload de arquivo concluído com sucesso:', imageUrl);
      } else {
        console.error('Falha no upload do arquivo de imagem - uploadedUrl é null');
      }
    }
    // Se há uma URL de imagem, processar e fazer upload
    else if (formData.imageUrl) {
      console.log('Processando upload de imagem via URL:', formData.imageUrl);
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
            console.log('Upload de URL concluído com sucesso:', imageUrl);
          } else {
            console.error('Falha no upload da imagem via URL');
          }
        } else {
          console.warn('Não foi possível baixar a imagem da URL fornecida');
          imageUrl = formData.imageUrl; // Fallback para URL original
        }
      } catch (error) {
        console.warn('Erro ao processar imagem da URL:', error);
        imageUrl = formData.imageUrl; // Fallback para URL original
      }
    }

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
      valor: Math.round((typeof formData.valor === 'string' ? parseFloat(formData.valor) || 0 : formData.valor || 0) * 100), // Converter para centavos (inteiro)
      
      // Conteúdo e mídia
      conteudo: formData.conteudo,
      url_imagem: imageUrl || null,
      audio_original: formData.audioOriginal || null,
      
      // Valores padrão
      status: 'active',
      visualizacoes: 0,
      criada_por: user.id
    };

    console.log('=== DADOS FINAIS ANTES DA INSERÇÃO ===');
    console.log('Valor da imageUrl antes de inserir:', imageUrl);
    console.log('formData.imageFile existe?', !!formData.imageFile);
    console.log('formData.imageUrl:', formData.imageUrl);
    console.log('Tipo de imageUrl:', typeof imageUrl);
    console.log('imageUrl é null?', imageUrl === null);
    console.log('imageUrl é undefined?', imageUrl === undefined);
    console.log('imageUrl é string vazia?', imageUrl === '');
    console.log('Dados do verso a serem inseridos:', {
      ...verseData,
      url_imagem: imageUrl
    });
    console.log('========================================');
    
    // Adicionar timeout mais agressivo para evitar loops infinitos
    const insertPromise = supabase
      .from('versoes')
      .insert(verseData)
      .select()
      .single();
      
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Operação demorou mais que 15 segundos')), 15000);
    });
    
    const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

    if (error) {
      console.error('Erro ao criar verso no Supabase:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Tratamento específico para diferentes tipos de erro
      if (error.code === '23505') {
        throw new Error('Erro: Já existe um verso com este título. Tente um título diferente.');
      } else if (error.code === '42501' || error.message?.includes('RLS') || error.message?.includes('policy')) {
        throw new Error('Erro de permissão: Você precisa ter um perfil de administrador para criar versos. Faça logout e login novamente.');
      } else if (error.code === 'PGRST301') {
        throw new Error('Erro de permissão: Políticas de segurança impedem a criação do verso. Verifique suas permissões.');
      } else {
        throw new Error(`Erro ao salvar verso: ${error.message}`);
      }
    }

    console.log('Verso criado com sucesso:', data);
    return data;
  } catch (error) {
    console.error('Erro geral ao criar verso:', error);
    // Re-lançar o erro para que seja tratado no componente
    throw error;
  } finally {
    // Sempre liberar o lock, mesmo em caso de erro
    isCreatingVerse = false;
  }
};

<<<<<<< HEAD
// Função para buscar versos com paginação
export const getVersesPaginated = async (page: number = 1, limit: number = 50): Promise<{ data: any[], total: number, hasMore: boolean }> => {
  try {
    console.log(`Buscando versos - Página: ${page}, Limite: ${limit}`);
    
    const offset = (page - 1) * limit;
    
    // Primeiro, buscar o total de registros
    const { count, error: countError } = await supabase
      .from('versoes')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Erro ao contar registros:', countError);
      throw countError;
    }
    
    const totalRecords = count || 0;
    console.log(`Total de registros na base: ${totalRecords}`);
    
    // Buscar os dados paginados
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Erro ao buscar versos paginados:', error);
      throw error;
    }
    
    const processedData = data ? processVerseData(data) : [];
    const hasMore = offset + limit < totalRecords;
    
    console.log(`Retornando ${processedData.length} versos de ${totalRecords} total. Tem mais: ${hasMore}`);
    console.log(`📊 Cálculo hasMore: offset(${offset}) + limit(${limit}) = ${offset + limit} < totalRecords(${totalRecords}) = ${hasMore}`);
    
    return {
      data: processedData,
      total: totalRecords,
      hasMore
    };
  } catch (error) {
    console.error('Erro ao buscar versos paginados:', error);
    return { data: [], total: 0, hasMore: false };
  }
};

// Função para buscar todos os versos (mantida para compatibilidade)
export const getAllVerses = async (): Promise<any[]> => {
  try {
    console.log('Buscando todos os versos ativos da tabela versoes...');
    console.log('Cliente Supabase configurado:', !!supabase);
    console.log('Sessão atual:', await supabase.auth.getSession());
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Usuário autenticado:', !!session);
    if (session) {
      console.log('ID do usuário:', session.user.id);
      console.log('Email do usuário:', session.user.email);
    }
    
    // Usar o nome correto da tabela: 'versoes' (com acento)
    // Primeiro, vamos tentar buscar todos os registros sem filtro para debug
    console.log('Tentativa 0: Busca sem filtros');
    const { data: allData, error: allError } = await supabase
      .from('versoes')
      .select('*');
    
    console.log('Todos os registros da tabela versoes:', allData?.length || 0);
    if (allData && allData.length > 0) {
      console.log('Primeiro registro:', allData[0]);
    }
    if (allError) {
      console.error('Erro ao buscar todos os registros:', allError);
    }
    
    // Tentar diferentes abordagens para buscar os dados
    console.log('Tentativa 1: Busca com filtro status = active');
    const { data: activeData, error: activeError } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active')
      .order('id', { ascending: false })
      .limit(50);

    if (activeError) {
      console.error('Erro ao buscar versos ativos:', activeError);
    } else {
      console.log(`Versos encontrados: ${activeData?.length || 0}`);
      if (activeData && activeData.length > 0) {
        return processVerseData(activeData);
      }
    }
    
    // Tentativa 2: Buscar sem filtro de status (com limite)
    console.log('Tentativa 2: Busca sem filtro de status');
    const { data: allActiveData, error: allActiveError } = await supabase
      .from('versoes')
      .select('*')
      .order('id', { ascending: false })
      .limit(100);
      
    if (allActiveError) {
      console.error('Erro ao buscar todos os versos:', allActiveError);
    } else {
      console.log(`Todos os versos encontrados: ${allActiveData?.length || 0}`);
      if (allActiveData && allActiveData.length > 0) {
        return processVerseData(allActiveData);
      }
    }
    
    // Tentativa 3: Buscar apenas os primeiros registros para garantir que algo seja retornado
    console.log('Tentativa 3: Busca simples dos primeiros registros');
    const { data: simpleData, error: simpleError } = await supabase
      .from('versoes')
      .select('*')
      .range(0, 49);
      
    if (simpleError) {
      console.error('Erro na busca simples:', simpleError);
    } else {
      console.log(`Registros encontrados na busca simples: ${simpleData?.length || 0}`);
      if (simpleData && simpleData.length > 0) {
        return processVerseData(simpleData);
      }
    }
    
    // Se chegou aqui, não conseguiu dados de nenhuma forma
    console.log('Não foi possível obter dados de nenhuma forma. Retornando array vazio.');
    return [];
  } catch (error) {
    console.error('Erro ao buscar versos:', error);
    return [];
  }
};

// Função auxiliar para processar os dados dos versos
const processVerseData = (data: any[]) => {
  console.log('Processando dados dos versos:', data.length);
  console.log('Dados brutos completos:', JSON.stringify(data));
  if (data.length > 0) {
    console.log('Primeiro verso da tabela versoes (dados brutos):', {
      id: data[0].id,
      titulo_pt_br: data[0].titulo_pt_br,
      musical: data[0].musical,
      estilo: data[0].estilo,
      url_imagem: data[0].url_imagem,
      visualizacoes: data[0].visualizacoes,
      valor: data[0].valor ? data[0].valor / 100 : 0 // Converter de centavos para reais
    });
  }
  
  // Mapear os dados da tabela versoes para o formato esperado pelo componente HomePage
  const mappedData = data.map(verso => {
    // Determinar a categoria com base no estilo ou origem
    let category = 'Teatro Musical';
    if (Array.isArray(verso.estilo) && verso.estilo.length > 0) {
      category = verso.estilo[0];
    } else if (verso.origem) {
      const origem = verso.origem.toLowerCase();
      if (origem.includes('hamilton')) {
        category = 'Hip Hop';
      } else if (origem.includes('miseráveis') || origem.includes('miserables')) {
        category = 'Drama Musical';
      } else if (origem.includes('rei leão') || origem.includes('lion king')) {
        category = 'Animação';
      }
    }
    
    // Mapear campos para o formato esperado pelo MusicCard
    const mapped = {
      id: verso.id,
      // Campos para compatibilidade com o componente MusicCard
      title: verso.titulo_original,
      artist: verso.musical,
      category: category,
      image: verso.url_imagem || '/musical-generic.svg',
      views: verso.visualizacoes || 0,
      price: verso.valor ? verso.valor / 100 : 0, // Converter de centavos para reais
      classificacoes: verso.classificacao_vocal_alt,
      
      // Campos originais da tabela versoes
      titulo_pt_br: verso.titulo_pt_br,
      titulo_original: verso.titulo_original,
      musical: verso.musical,
      estilo: verso.estilo || [], // Garantir que seja sempre um array
      url_imagem: verso.url_imagem || '/musical-generic.svg',
      visualizacoes: verso.visualizacoes || 0,
      valor: verso.valor ? verso.valor / 100 : 0, // Converter de centavos para reais
      status: verso.status || 'active',
      criada_em: verso.criada_em || new Date().toISOString(),
      letra_original: verso.letra_original,
      compositor: verso.compositor,
      letrista: verso.letrista,
      versionista: verso.versionista,
      conteudo: verso.conteudo,
      classificacao_vocal_alt: verso.classificacao_vocal_alt
    };
    
    console.log(`Verso mapeado ${verso.id}:`, {
      id: mapped.id,
      title: mapped.title,
      artist: mapped.artist,
      category: mapped.category,
      image: mapped.image,
      views: mapped.views,
      price: mapped.price ? mapped.price / 100 : 0 // Converter de centavos para reais
    });
    
    return mapped;
  });
  
  console.log(`Versos mapeados: ${mappedData.length}`);
  return mappedData;
};

// Função para gerar slug a partir do título
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
    .replace(/-+/g, '-'); // Remove hífens duplicados
=======
// Função para buscar todos os versos
export const getAllVerses = async (): Promise<Verse[]> => {
  try {
    console.log('=== INICIANDO getAllVerses ===');
    
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .order('criada_em', { ascending: false });

    console.log('=== RESULTADO DA QUERY ===');
    console.log('Error:', error);
    console.log('Data length:', data?.length || 0);
    console.log('Raw data:', data);
    
    if (error) {
      console.error('Erro na query Supabase:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('=== DADOS VAZIOS OU NULOS ===');
      console.log('Data é null?', data === null);
      console.log('Data é array vazio?', Array.isArray(data) && data.length === 0);
      return [];
    }
    
    console.log('=== DADOS ENCONTRADOS ===');
    console.log('Total de registros:', data.length);
    console.log('Primeiro registro completo:', JSON.stringify(data[0], null, 2));
    console.log('Campos do primeiro registro:', Object.keys(data[0] || {}));
    
    return data;
  } catch (error) {
    console.error('=== ERRO GERAL em getAllVerses ===');
    console.error('Tipo do erro:', typeof error);
    console.error('Erro completo:', error);
    throw error;
  }
>>>>>>> abd277ab6c88590b3fcb587a9672bcda1c8713d4
};

// Função para buscar um verso por ID
export const getVerseById = async (id: number): Promise<Verse | null> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('id', id)
      .eq('status', 'active');

    if (error) {
      console.error('Erro ao buscar verso:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.error('Verso não encontrado com ID:', id);
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Erro ao buscar verso:', error);
    return null;
  }
};

// Função para buscar um verso por slug (título)
export const getVerseBySlug = async (slug: string): Promise<Verse | null> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('Erro ao buscar versos:', error);
      return null;
    }

    // Encontrar o verso que corresponde ao slug
    // Usar titulo_pt_br se disponível, senão usar titulo_original
    const verse = data?.find(v => {
      const title = v.titulo_pt_br && v.titulo_pt_br.trim() !== '' ? v.titulo_pt_br : v.titulo_original;
      return generateSlug(title || '') === slug;
    });
    return verse || null;
  } catch (error) {
    console.error('Erro ao buscar verso por slug:', error);
    return null;
  }
};

// Função para buscar verso por ID ou slug
export const getVerse = async (identifier: string): Promise<Verse | null> => {
  // Verificar se é um número (ID) ou string (slug)
  const id = parseInt(identifier);
  if (!isNaN(id)) {
    return await getVerseById(id);
  } else {
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
      .eq('status', 'active')
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
      .eq('status', 'active')
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
      console.log('Processando upload de arquivo de imagem...');
      const fileName = `verse_${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const uploadedUrl = await uploadImage(formData.imageFile, fileName);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
        console.log('Upload de arquivo concluído com sucesso:', imageUrl);
      } else {
        console.error('Falha no upload do arquivo de imagem');
      }
    }
    // Se há uma URL de imagem e não é do bucket 'capas', processar e fazer upload
    else if (formData.imageUrl && !formData.imageUrl.includes('/capas/')) {
      console.log('Processando upload de imagem via URL:', formData.imageUrl);
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
            console.log('Upload de URL concluído com sucesso:', imageUrl);
          } else {
            console.error('Falha no upload da imagem via URL');
          }
        } else {
          console.warn('Não foi possível baixar a imagem da URL fornecida');
          imageUrl = formData.imageUrl; // Fallback para URL original
        }
      } catch (error) {
        console.warn('Erro ao processar imagem da URL:', error);
        imageUrl = formData.imageUrl; // Fallback para URL original
      }
    }

    const updateData: VerseUpdate = {};
    
    // Mapear campos do formulário para campos do banco
    // Campo origem removido - não existe na tabela versoes
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
      console.error('Erro do Supabase ao atualizar verso:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('Nenhum verso foi atualizado. Verifique se o ID existe:', id);
      throw new Error(`Verso com ID ${id} não encontrado`);
    }

    console.log('Verso atualizado com sucesso:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Erro ao atualizar verso:', error);
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
      console.error('Erro ao deletar verso:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar verso:', error);
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
    console.error('Erro ao incrementar visualizações:', error);
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
<<<<<<< HEAD

// Função para buscar categorias únicas
export const getCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('versoes')
      .select('estilo')
      .eq('status', 'active');

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
=======
>>>>>>> abd277ab6c88590b3fcb587a9672bcda1c8713d4
