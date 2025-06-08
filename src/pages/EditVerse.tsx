import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Music, Calendar, User, FileText, Type, Upload, Image, Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { updateVerse, getVerseById, VerseFormData } from '../services/versesService';
import { toast } from '@/components/ui/sonner';
import { Database } from '../integrations/supabase/types';

type Verse = Database['public']['Tables']['versoes']['Row'];

const EditVerse = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [formData, setFormData] = useState<VerseFormData>({
    compositor: '',
    letraOriginal: '',
    letrista: '',
    versionista: '',
    revisao: '',
    versionadoEm: new Date().toISOString().split('T')[0],
    titulo_pt_br: '',
    titulo_original: '',
    musical: '',
    estilo: '',
    conteudo: '',
    audioOriginal: '',
    imageUrl: '',
    imageFile: undefined,
    valor: 0
  });

  const [isPreview, setIsPreview] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);

  const categories = ['Gospel', 'Louvor', 'Adoração', 'Contemporâneo', 'Teatro Musical', 'Clássico'];

  // Configuração do editor rich text
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'align', 'list', 'bullet', 'blockquote', 'code-block', 'link'
  ];

  // Carregar dados do verso para edição
  useEffect(() => {
    const loadVerse = async () => {
      if (!id) {
        toast.error('ID do verso não encontrado');
        navigate('/manage-verses');
        return;
      }

      try {
        setIsLoadingVerse(true);
        const verseData = await getVerseById(parseInt(id));
        
        if (!verseData) {
          toast.error('Verso não encontrado');
          navigate('/manage-verses');
          return;
        }

        setVerse(verseData);
        
        // Preencher o formulário com os dados do verso
        setFormData({
          compositor: Array.isArray(verseData.compositor) ? verseData.compositor[0] || '' : verseData.compositor || '',
          letraOriginal: verseData.letra_original || '',
          letrista: Array.isArray(verseData.letrista) ? verseData.letrista[0] || '' : verseData.letrista || '',
          versionista: Array.isArray(verseData.versionista) ? verseData.versionista[0] || '' : verseData.versionista || '',
          revisao: Array.isArray(verseData.revisao) ? verseData.revisao[0] || '' : verseData.revisao || '',
          versionadoEm: verseData.versionado_em || new Date().toISOString().split('T')[0],
          titulo_pt_br: verseData.titulo_pt_br || '',
          titulo_original: verseData.titulo_original || '',
          musical: verseData.musical || '',
          estilo: Array.isArray(verseData.estilo) ? verseData.estilo[0] || '' : verseData.estilo || '',
          conteudo: verseData.conteudo || '',
          audioOriginal: verseData.audio_original || '',
          imageUrl: verseData.url_imagem || '',
          imageFile: undefined,
          valor: verseData.valor ? verseData.valor / 100 : 0 // Converter de centavos para reais
        });

        if (verseData.url_imagem) {
          setImagePreview(verseData.url_imagem);
        }
      } catch (error) {
        console.error('Erro ao carregar verso:', error);
        toast.error('Erro ao carregar dados do verso');
        navigate('/manage-verses');
      } finally {
        setIsLoadingVerse(false);
      }
    };

    loadVerse();
  }, [id, navigate]);

  const handleInputChange = (field: keyof VerseFormData, value: any) => {
    // Tratamento especial para o campo valor (aceitar vírgula e ponto)
    if (field === 'valor') {
      // Se for string, substituir vírgula por ponto e converter para número
      if (typeof value === 'string') {
        const normalizedValue = value.replace(',', '.');
        const numericValue = parseFloat(normalizedValue) || 0;
        setFormData(prev => ({
          ...prev,
          [field]: numericValue
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo_pt_br.trim()) {
      toast.error('O título em português é obrigatório');
      return;
    }

    if (!formData.musical.trim()) {
      toast.error('O nome do musical é obrigatório');
      return;
    }

    if (!formData.letraOriginal.trim()) {
      toast.error('A letra original é obrigatória');
      return;
    }

    try {
      setIsLoading(true);
      
      const updatedVerse = await updateVerse(parseInt(id!), formData);
      
      if (updatedVerse) {
        toast.success('Verso atualizado com sucesso!');
        navigate('/manage-verses');
      } else {
        toast.error('Erro ao atualizar verso. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao atualizar verso:', error);
      toast.error('Erro ao atualizar verso. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingVerse) {
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-gray-600">Carregando dados do verso...</p>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 sm:px-6 py-8">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link to="/manage-verses">
                <Button variant="outline" size="sm" className="rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Editar Verso</h1>
                <p className="text-gray-600 mt-1">Edite as informações do verso musical</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreview(!isPreview)}
                className="rounded-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                {isPreview ? 'Editar' : 'Visualizar'}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Coluna Principal - Formulário */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informações Básicas */}
                <Card className="p-6 border-0 shadow-sm">
                  <div className="flex items-center space-x-2 mb-6">
                    <Music className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-gray-900">Informações Básicas</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="titulo_pt_br" className="text-sm font-medium text-gray-700">
                        Título em Português *
                      </Label>
                      <Input
                        id="titulo_pt_br"
                        value={formData.titulo_pt_br}
                        onChange={(e) => handleInputChange('titulo_pt_br', e.target.value)}
                        placeholder="Digite o título em português"
                        className="rounded-lg border-gray-300 focus:border-primary"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="musical" className="text-sm font-medium text-gray-700">
                        Musical *
                      </Label>
                      <Input
                        id="musical"
                        value={formData.musical}
                        onChange={(e) => handleInputChange('musical', e.target.value)}
                        placeholder="Nome do musical"
                        className="rounded-lg border-gray-300 focus:border-primary"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="titulo_original" className="text-sm font-medium text-gray-700">
                        Título Original
                      </Label>
                      <Input
                        id="titulo_original"
                        value={formData.titulo_original}
                        onChange={(e) => handleInputChange('titulo_original', e.target.value)}
                        placeholder="Título na língua original"
                        className="rounded-lg border-gray-300 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="estilo" className="text-sm font-medium text-gray-700">
                        Categoria
                      </Label>
                      <select
                        id="estilo"
                        value={formData.estilo}
                        onChange={(e) => handleInputChange('estilo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valor" className="text-sm font-medium text-gray-700">
                        Valor (R$)
                      </Label>
                      <Input
                        id="valor"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) => handleInputChange('valor', e.target.value)}
                        placeholder="0.00"
                        className="rounded-lg border-gray-300 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="versionadoEm" className="text-sm font-medium text-gray-700">
                        Data de Versionamento
                      </Label>
                      <Input
                        id="versionadoEm"
                        type="date"
                        value={formData.versionadoEm}
                        onChange={(e) => handleInputChange('versionadoEm', e.target.value)}
                        className="rounded-lg border-gray-300 focus:border-primary"
                      />
                    </div>
                  </div>
                </Card>

                {/* Créditos */}
                <Card className="p-6 border-0 shadow-sm">
                  <div className="flex items-center space-x-2 mb-6">
                    <User className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-gray-900">Créditos</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="compositor" className="text-sm font-medium text-gray-700">
                        Compositor
                      </Label>
                      <Input
                        id="compositor"
                        value={formData.compositor}
                        onChange={(e) => handleInputChange('compositor', e.target.value)}
                        placeholder="Nome do compositor"
                        className="rounded-lg border-gray-300 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="letrista" className="text-sm font-medium text-gray-700">
                        Letrista
                      </Label>
                      <Input
                        id="letrista"
                        value={formData.letrista}
                        onChange={(e) => handleInputChange('letrista', e.target.value)}
                        placeholder="Nome do letrista"
                        className="rounded-lg border-gray-300 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="versionista" className="text-sm font-medium text-gray-700">
                        Versionista
                      </Label>
                      <Input
                        id="versionista"
                        value={formData.versionista}
                        onChange={(e) => handleInputChange('versionista', e.target.value)}
                        placeholder="Nome do versionista"
                        className="rounded-lg border-gray-300 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="revisao" className="text-sm font-medium text-gray-700">
                        Revisor
                      </Label>
                      <Input
                        id="revisao"
                        value={formData.revisao}
                        onChange={(e) => handleInputChange('revisao', e.target.value)}
                        placeholder="Nome do revisor"
                        className="rounded-lg border-gray-300 focus:border-primary"
                      />
                    </div>
                  </div>
                </Card>

                {/* Conteúdo */}
                <Card className="p-6 border-0 shadow-sm">
                  <div className="flex items-center space-x-2 mb-6">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-gray-900">Conteúdo</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="letraOriginal" className="text-sm font-medium text-gray-700">
                        Letra Original *
                      </Label>
                      <Textarea
                        id="letraOriginal"
                        value={formData.letraOriginal}
                        onChange={(e) => handleInputChange('letraOriginal', e.target.value)}
                        placeholder="Digite a letra original da música"
                        className="min-h-[120px] rounded-lg border-gray-300 focus:border-primary"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Conteúdo da Versão
                      </Label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <ReactQuill
                          value={formData.conteudo}
                          onChange={(value) => handleInputChange('conteudo', value)}
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="Digite o conteúdo da versão em português..."
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Coluna Lateral - Mídia e Ações */}
              <div className="space-y-6">
                {/* Upload de Imagem */}
                <Card className="p-6 border-0 shadow-sm">
                  <div className="flex items-center space-x-2 mb-6">
                    <Image className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-gray-900">Imagem</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Método de Upload */}
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={uploadMethod === 'url' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUploadMethod('url')}
                        className="flex-1 rounded-full"
                      >
                        URL
                      </Button>
                      <Button
                        type="button"
                        variant={uploadMethod === 'file' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUploadMethod('file')}
                        className="flex-1 rounded-full"
                      >
                        Upload
                      </Button>
                    </div>
                    
                    {uploadMethod === 'url' ? (
                      <div className="space-y-2">
                        <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-700">
                          URL da Imagem
                        </Label>
                        <Input
                          id="imageUrl"
                          value={formData.imageUrl}
                          onChange={(e) => handleImageUrlChange(e.target.value)}
                          placeholder="https://exemplo.com/imagem.jpg"
                          className="rounded-lg border-gray-300 focus:border-primary"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="imageFile" className="text-sm font-medium text-gray-700">
                          Arquivo de Imagem
                        </Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                          <input
                            id="imageFile"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <label htmlFor="imageFile" className="cursor-pointer">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Clique para selecionar uma imagem</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</p>
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {/* Preview da Imagem */}
                    {imagePreview && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Preview</Label>
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={() => setImagePreview('')}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Áudio */}
                <Card className="p-6 border-0 shadow-sm">
                  <div className="flex items-center space-x-2 mb-6">
                    <Video className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-gray-900">Áudio</h2>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="audioOriginal" className="text-sm font-medium text-gray-700">
                      URL do Áudio Original
                    </Label>
                    <Input
                      id="audioOriginal"
                      value={formData.audioOriginal}
                      onChange={(e) => handleInputChange('audioOriginal', e.target.value)}
                      placeholder="https://exemplo.com/audio.mp3"
                      className="rounded-lg border-gray-300 focus:border-primary"
                    />
                  </div>
                </Card>

                {/* Ações */}
                <Card className="p-6 border-0 shadow-sm">
                  <div className="space-y-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-primary/90 rounded-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                    
                    <Link to="/manage-verses" className="block">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-full"
                      >
                        Cancelar
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </form>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};

export default EditVerse;