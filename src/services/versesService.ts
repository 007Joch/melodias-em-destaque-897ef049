import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';

type Verse = Database['public']['Tables']['verses']['Row'];
type VerseInsert = Database['public']['Tables']['verses']['Insert'];
type VerseUpdate = Database['public']['Tables']['verses']['Update'];

export interface VerseFormData {
  // Informações do Musical
  musical: string;
  musica: string;
  letraOriginal: string;
  letraOriginalDe: string;
  versaoBrasileiraDE: string;
  textoRevisadoPor: string;
  data: string;
  
  // Informações do Produto
  title: string;
  artist: string;
  category: string;
  descricao: string;
  
  // Conteúdo e mídia
  conteudo: string;
  imageFile?: File;
  imageUrl?: string;
  youtubeUrl?: string;
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
    
    // Redimensionar imagem automaticamente
    const resizedFile = await resizeImage(file);
    console.log('Imagem redimensionada:', { newSize: resizedFile.size, newType: resizedFile.type });
    
    const filePath = `verses/${fileName}.jpg`; // Sempre salvar como JPG
    console.log('Caminho do arquivo:', filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, resizedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro detalhado no upload:', {
        message: uploadError.message,
        error: uploadError
      });
      return null;
    }

    console.log('Upload realizado com sucesso:', uploadData);

    // Obter URL pública da imagem
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log('URL pública gerada:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Erro geral no upload da imagem:', error);
    return null;
  }
};

// Função para criar um novo verso
export const createVerse = async (formData: VerseFormData): Promise<Verse | null> => {
  try {
    console.log('Iniciando criação de verso:', { title: formData.title, hasImageFile: !!formData.imageFile, hasImageUrl: !!formData.imageUrl });
    
    // Obter o usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Usuário não autenticado:', authError);
      throw new Error('Usuário deve estar autenticado para criar um verso');
    }

    console.log('Usuário autenticado:', user.id);
    let imageUrl = null;

    // Se há um arquivo de imagem, fazer upload
    if (formData.imageFile) {
      console.log('Processando upload de arquivo de imagem...');
      const fileName = `verse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const uploadedUrl = await uploadImage(formData.imageFile, fileName);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
        console.log('Upload de arquivo concluído com sucesso:', imageUrl);
      } else {
        console.error('Falha no upload do arquivo de imagem');
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

    const verseData: VerseInsert = {
      // Informações do musical
      musical: formData.musical,
      musica: formData.musica,
      letra_original: formData.letraOriginal,
      letra_original_de: formData.letraOriginalDe,
      versao_brasileira_de: formData.versaoBrasileiraDE,
      texto_revisado_por: formData.textoRevisadoPor,
      data: formData.data,
      
      // Informações do produto
      title: formData.title,
      artist: formData.artist,
      category: formData.category,
      descricao: formData.descricao,
      
      // Conteúdo e mídia
      conteudo: formData.conteudo,
      image_url: imageUrl,
      youtube_url: formData.youtubeUrl || null,
      
      // Valores padrão
      status: 'active',
      views: 0,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('verses')
      .insert(verseData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar verso:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar verso:', error);
    return null;
  }
};

// Função para buscar todos os versos
export const getAllVerses = async (): Promise<Verse[]> => {
  const { data, error } = await supabase
    .from('verses')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar versos:', error);
    throw error;
  }

  return data || [];
};

// Função para buscar um verso por ID
export const getVerseById = async (id: number): Promise<Verse | null> => {
  try {
    const { data, error } = await supabase
      .from('verses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar verso:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar verso:', error);
    return null;
  }
};

// Função para atualizar um verso
export const updateVerse = async (id: number, formData: Partial<VerseFormData>): Promise<Verse | null> => {
  try {
    let imageUrl = formData.imageUrl;

    // Se há um arquivo de imagem, fazer upload
    if (formData.imageFile) {
      const fileName = `verse_${id}_${Date.now()}`;
      const uploadedUrl = await uploadImage(formData.imageFile, fileName);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const updateData: VerseUpdate = {};
    
    // Mapear campos do formulário para campos do banco
    if (formData.musical !== undefined) updateData.musical = formData.musical;
    if (formData.musica !== undefined) updateData.musica = formData.musica;
    if (formData.letraOriginal !== undefined) updateData.letra_original = formData.letraOriginal;
    if (formData.letraOriginalDe !== undefined) updateData.letra_original_de = formData.letraOriginalDe;
    if (formData.versaoBrasileiraDE !== undefined) updateData.versao_brasileira_de = formData.versaoBrasileiraDE;
    if (formData.textoRevisadoPor !== undefined) updateData.texto_revisado_por = formData.textoRevisadoPor;
    if (formData.data !== undefined) updateData.data = formData.data;
    if (formData.title !== undefined) updateData.title = formData.title;
    if (formData.artist !== undefined) updateData.artist = formData.artist;
    if (formData.category !== undefined) updateData.category = formData.category;
    if (formData.descricao !== undefined) updateData.descricao = formData.descricao;
    if (formData.conteudo !== undefined) updateData.conteudo = formData.conteudo;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (formData.youtubeUrl !== undefined) updateData.youtube_url = formData.youtubeUrl;

    const { data, error } = await supabase
      .from('verses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar verso:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar verso:', error);
    return null;
  }
};

// Função para deletar um verso
export const deleteVerse = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('verses')
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
          .from('verses')
          .update({ views: (verse.views || 0) + 1 })
          .eq('id', id);
      }
    }
  } catch (error) {
    console.error('Erro ao incrementar visualizações:', error);
  }
};

// Função para buscar versos por categoria
export const getVersesByCategory = async (category: string): Promise<Verse[]> => {
  try {
    const { data, error } = await supabase
      .from('verses')
      .select('*')
      .eq('category', category)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

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

// Função para buscar versos por artista
export const getVersesByArtist = async (artist: string): Promise<Verse[]> => {
  try {
    const { data, error } = await supabase
      .from('verses')
      .select('*')
      .eq('artist', artist)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar versos por artista:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar versos por artista:', error);
    return [];
  }
};