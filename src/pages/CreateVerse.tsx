import React, { useState } from 'react';
import { ArrowLeft, Save, Eye, Music, Calendar, User, FileText, Type, Upload, Image, Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { createVerse, VerseFormData } from '../services/versesService';
import { toast } from '@/components/ui/sonner';

const CreateVerse = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<VerseFormData>({
    musical: '',
    musica: '',
    letraOriginal: '',
    letraOriginalDe: '',
    versaoBrasileiraDE: '',
    textoRevisadoPor: '',
    data: new Date().toISOString().split('T')[0],
    title: '',
    artist: '',
    category: '',
    descricao: '',
    conteudo: '',
    youtubeUrl: '',
    imageUrl: '',
    imageFile: undefined
  });

  const [isPreview, setIsPreview] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['Gospel', 'Louvor', 'Adoração', 'Contemporâneo', 'Teatro Musical', 'Clássico'];

  // Configuração do editor rich text
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'align', 'list', 'bullet', 'indent',
    'color', 'background', 'blockquote', 'code-block',
    'link'
  ];

  const handleInputChange = (field: keyof VerseFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipos de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Formato não suportado. Use: JPEG, JPG, PNG, SVG ou WebP');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      
      setFormData(prev => ({ ...prev, imageFile: file }));
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.title || !formData.artist || !formData.category || !formData.musical || !formData.musica || !formData.data) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await createVerse(formData);
      
      if (result) {
        toast.success('Verso criado com sucesso!');
        // Resetar o formulário
        setFormData({
          musical: '',
          musica: '',
          letraOriginal: '',
          letraOriginalDe: '',
          versaoBrasileiraDE: '',
          textoRevisadoPor: '',
          data: new Date().toISOString().split('T')[0],
          title: '',
          artist: '',
          category: '',
          descricao: '',
          conteudo: '',
          youtubeUrl: '',
          imageUrl: '',
          imageFile: undefined
        });
        setImagePreview('');
        // Navegar para a homepage para ver o novo verso
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        toast.error('Erro ao criar verso. Verifique os dados e tente novamente.');
      }
    } catch (error: any) {
      console.error('Erro ao salvar verso:', error);
      
      // Tratamento específico de erros
      if (error.message && error.message.includes('autenticado')) {
        toast.error('Você precisa estar logado para criar um verso. Faça login e tente novamente.');
        navigate('/login');
      } else if (error.message && error.message.includes('RLS')) {
        toast.error('Erro de permissão. Verifique se você tem acesso para criar versos.');
      } else {
        toast.error('Erro ao salvar verso. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    // Navegar para página de preview com os dados
    const previewData = encodeURIComponent(JSON.stringify(formData));
    window.open(`/verse/preview?data=${previewData}`, '_blank');
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Novo Verso</h1>
                <p className="text-gray-600">Cadastre um novo verso musical</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePreview}
                className="rounded-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
              <Button 
                type="submit" 
                form="verse-form"
                className="bg-primary hover:bg-primary/90 rounded-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Verso
                  </>
                )}
              </Button>
            </div>
          </div>

          <form id="verse-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Informações do Musical */}
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <Music className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Informações do Musical</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="musical" className="text-sm font-medium text-gray-700 mb-2 block">
                    Do Musical *
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
                
                <div>
                  <Label htmlFor="musica" className="text-sm font-medium text-gray-700 mb-2 block">
                    Música *
                  </Label>
                  <Input
                    id="musica"
                    value={formData.musica}
                    onChange={(e) => handleInputChange('musica', e.target.value)}
                    placeholder="Nome da música"
                    className="rounded-lg border-gray-300 focus:border-primary"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="letraOriginal" className="text-sm font-medium text-gray-700 mb-2 block">
                    Letra Original
                  </Label>
                  <Input
                    id="letraOriginal"
                    value={formData.letraOriginal}
                    onChange={(e) => handleInputChange('letraOriginal', e.target.value)}
                    placeholder="Autor da letra original"
                    className="rounded-lg border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div>
                  <Label htmlFor="letraOriginalDe" className="text-sm font-medium text-gray-700 mb-2 block">
                    Letra Original de
                  </Label>
                  <Input
                    id="letraOriginalDe"
                    value={formData.letraOriginalDe}
                    onChange={(e) => handleInputChange('letraOriginalDe', e.target.value)}
                    placeholder="Origem da letra original"
                    className="rounded-lg border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div>
                  <Label htmlFor="versaoBrasileiraDE" className="text-sm font-medium text-gray-700 mb-2 block">
                    Versão Brasileira de
                  </Label>
                  <Input
                    id="versaoBrasileiraDE"
                    value={formData.versaoBrasileiraDE}
                    onChange={(e) => handleInputChange('versaoBrasileiraDE', e.target.value)}
                    placeholder="Responsável pela versão brasileira"
                    className="rounded-lg border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div>
                  <Label htmlFor="textoRevisadoPor" className="text-sm font-medium text-gray-700 mb-2 block">
                    Texto Revisado por
                  </Label>
                  <Input
                    id="textoRevisadoPor"
                    value={formData.textoRevisadoPor}
                    onChange={(e) => handleInputChange('textoRevisadoPor', e.target.value)}
                    placeholder="Responsável pela revisão"
                    className="rounded-lg border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div>
                  <Label htmlFor="data" className="text-sm font-medium text-gray-700 mb-2 block">
                    Data *
                  </Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => handleInputChange('data', e.target.value)}
                    className="rounded-lg border-gray-300 focus:border-primary"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Informações do Produto */}
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Informações do Produto</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">
                    Título *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Título do verso"
                    className="rounded-lg border-gray-300 focus:border-primary"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="artist" className="text-sm font-medium text-gray-700 mb-2 block">
                    Artista *
                  </Label>
                  <Input
                    id="artist"
                    value={formData.artist}
                    onChange={(e) => handleInputChange('artist', e.target.value)}
                    placeholder="Nome do artista"
                    className="rounded-lg border-gray-300 focus:border-primary"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2 block">
                    Categoria *
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary px-3 py-2"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Thumbnail do Verso
                  </Label>
                  
                  {/* Seletor de método */}
                  <div className="flex space-x-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="uploadMethod"
                        value="url"
                        checked={uploadMethod === 'url'}
                        onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">URL Externa</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="uploadMethod"
                        value="file"
                        checked={uploadMethod === 'file'}
                        onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Upload Local</span>
                    </label>
                  </div>
                  
                  {uploadMethod === 'url' ? (
                    <div className="space-y-3">
                      {/* Informações sobre dimensões recomendadas para URL */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <Image className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">📐 Dimensões Recomendadas:</p>
                            <p className="text-xs">• <strong>Ideal:</strong> 400x400px (formato quadrado)</p>
                            <p className="text-xs">• <strong>Proporção:</strong> 1:1 para melhor visualização nos cards</p>
                            <p className="text-xs text-blue-600 mt-1">💡 <em>Imagens de URL também são otimizadas automaticamente!</em></p>
                          </div>
                        </div>
                      </div>
                      
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl || ''}
                        onChange={(e) => {
                          handleInputChange('imageUrl', e.target.value);
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="rounded-lg border-gray-300 focus:border-primary"
                      />
                      
                      {formData.imageUrl && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-700 font-medium">
                            ✓ URL da imagem inserida
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            🔄 Será automaticamente otimizada para 400x400px com fundo branco
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Informações sobre dimensões recomendadas */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <div className="flex items-start space-x-2">
                          <Image className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">📐 Dimensões Recomendadas:</p>
                            <p className="text-xs">• <strong>Ideal:</strong> 400x400px (formato quadrado)</p>
                            <p className="text-xs">• <strong>Proporção:</strong> 1:1 para melhor visualização nos cards</p>
                            <p className="text-xs text-blue-600 mt-1">💡 <em>Não se preocupe! Nosso sistema ajusta automaticamente qualquer imagem para o formato ideal.</em></p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                            </p>
                            <p className="text-xs text-gray-500">JPEG, JPG, PNG, SVG, WebP (máx. 5MB)</p>
                            <p className="text-xs text-green-600 mt-1">✨ Redimensionamento automático ativado</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".jpeg,.jpg,.png,.svg,.webp"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                      {formData.imageFile && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-700 font-medium">
                            ✓ Arquivo selecionado: {formData.imageFile.name}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            🔄 Será automaticamente otimizado para 400x400px com fundo branco
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Preview da imagem */}
                  {imagePreview && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Preview
                      </Label>
                      <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
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
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="descricao" className="text-sm font-medium text-gray-700 mb-2 block">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    placeholder="Descrição do verso musical..."
                    className="rounded-lg border-gray-300 focus:border-primary min-h-[100px]"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="youtubeUrl" className="text-sm font-medium text-gray-700 mb-2 block">
                    Vídeo do YouTube
                  </Label>
                  <Input
                    id="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="rounded-lg border-gray-300 focus:border-primary"
                  />
                  {formData.youtubeUrl && extractYouTubeId(formData.youtubeUrl) && (
                    <div className="mt-3">
                      <p className="text-sm text-green-600 mb-2">✓ Vídeo válido detectado</p>
                      <div className="aspect-video w-full max-w-sm">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYouTubeId(formData.youtubeUrl)}`}
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                          title="Preview do vídeo"
                        />
                      </div>
                    </div>
                  )}
                  {formData.youtubeUrl && !extractYouTubeId(formData.youtubeUrl) && (
                    <p className="text-sm text-red-600 mt-2">⚠ URL do YouTube inválida</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Editor de Conteúdo */}
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <Type className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Conteúdo do Verso</h2>
                <div className="text-sm text-gray-500 ml-auto">
                  Editor visual com formatação completa
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">💡 Dica de Uso</h3>
                  <p className="text-sm text-blue-800">
                    Use este editor para formatar todo o conteúdo do verso. Você pode:
                  </p>
                  <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
                    <li>Destacar nomes de personagens em <strong>negrito</strong></li>
                    <li>Usar <em>itálico</em> para indicações cênicas</li>
                    <li>Alinhar textos e criar listas</li>
                    <li>Copiar e colar conteúdo formatado do Word</li>
                  </ul>
                </div>
                
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={formData.conteudo}
                    onChange={(value) => handleInputChange('conteudo', value)}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Digite ou cole o conteúdo do verso aqui. Use as ferramentas de formatação para destacar personagens, indicações cênicas, etc."
                    style={{ minHeight: '300px' }}
                  />
                </div>
              </div>
            </Card>
          </form>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};

export default CreateVerse;