import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Music, Calendar, User, FileText, Type, Upload, Image, Video, Loader2, Plus, Search, X } from 'lucide-react';
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
import { createVerse, VerseFormData, searchVersesByTitle, Verse } from '../services/versesService';
import { toast } from '@/components/ui/sonner';
import PriceInput from '@/components/PriceInput';

const CreateVerse = () => {
  const navigate = useNavigate();
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
    valor: 0,
    versoes_irmas: []
  });

  const [isPreview, setIsPreview] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  
  // Estados para busca de versões irmãs
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<Verse[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const categories = ['Gospel', 'Louvor', 'Adoração', 'Contemporâneo', 'Teatro Musical', 'Clássico'];

  // Cleanup do timeout quando componente for desmontado
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);

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

  const handleInputChange = (field: keyof VerseFormData, value: string | number) => {
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

  // Funções para versões irmãs
  const handleSearchVerses = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchResults([]); // Limpa resultados anteriores
    
    try {
      console.log(`🔍 Iniciando busca por: "${term}"`);
      const results = await searchVersesByTitle(term);
      
      // Verifica se ainda é a busca atual (evita race conditions)
      if (searchTerm === term) {
        setSearchResults(results);
        console.log(`✅ Busca concluída: ${results.length} resultados`);
      } else {
        console.log('🚫 Busca cancelada - termo de busca mudou');
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar versos:', error);
      if (searchTerm === term) {
        setSearchResults([]);
        toast.error(`Erro na busca: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const addRelatedVerse = (verse: Verse) => {
    if (selectedVerses.length >= 10) {
      toast.error('Máximo de 10 versões irmãs permitidas');
      return;
    }

    if (selectedVerses.find(v => v.id === verse.id)) {
      toast.error('Esta versão já foi adicionada');
      return;
    }

    const newSelectedVerses = [...selectedVerses, verse];
    setSelectedVerses(newSelectedVerses);
    setFormData(prev => ({
      ...prev,
      versoes_irmas: newSelectedVerses.map(v => v.id)
    }));
    setSearchTerm('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const removeRelatedVerse = (verseId: number) => {
    const newSelectedVerses = selectedVerses.filter(v => v.id !== verseId);
    setSelectedVerses(newSelectedVerses);
    setFormData(prev => ({
      ...prev,
      versoes_irmas: newSelectedVerses.map(v => v.id)
    }));
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    
    // Prevenir múltiplas submissões (mínimo 3 segundos entre tentativas)
    if (isLoading) {
      console.log('Submissão já em andamento, ignorando...');
      toast.error('Aguarde, operação em andamento...');
      return;
    }
    
    if (now - lastSubmitTime < 3000) {
      console.log('Tentativa muito rápida, ignorando...');
      toast.error('Aguarde pelo menos 3 segundos entre tentativas.');
      return;
    }
    
    setLastSubmitTime(now);
    
    // Validação básica
    if (!formData.titulo_pt_br || !formData.musical || !formData.estilo || !formData.compositor || !formData.versionadoEm) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    console.log('Iniciando submissão do formulário...');
    setIsLoading(true);
    
    try {
      const result = await createVerse(formData);
      
      if (result) {
        toast.success('Verso criado com sucesso!');
        // Resetar o formulário
        setFormData({
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
          valor: 0,
          versoes_irmas: []
        });
        setSelectedVerses([]);
        setSearchTerm('');
        setSearchResults([]);
        setShowSearch(false);
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
      } else if (error.message && error.message.includes('operação em andamento')) {
        toast.error('Aguarde, já existe uma operação em andamento.');
      } else if (error.message && error.message.includes('Timeout')) {
        toast.error('A operação demorou muito para ser concluída. Tente novamente.');
      } else {
        toast.error(`Erro ao salvar verso: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      console.log('Finalizando submissão do formulário...');
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
          </div>

          <form id="verse-form" className="space-y-8" onSubmit={handleSubmit}>
            {/* Informações do Musical */}
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <Music className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Informações do Musical</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <Label htmlFor="compositor" className="text-sm font-medium text-gray-700 mb-2 block">
                    Música de *
                  </Label>
                  <Input
                    id="compositor"
                    value={formData.compositor}
                    onChange={(e) => handleInputChange('compositor', e.target.value)}
                    placeholder="Nome do compositor"
                    className="rounded-lg border-gray-300 focus:border-primary"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="letraOriginal" className="text-sm font-medium text-gray-700 mb-2 block">
                    Letra Original de
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
                  <Label htmlFor="letrista" className="text-sm font-medium text-gray-700 mb-2 block">
                    Letra original de
                  </Label>
                  <Input
                    id="letrista"
                    value={formData.letrista}
                    onChange={(e) => handleInputChange('letrista', e.target.value)}
                    placeholder="Nome do letrista"
                    className="rounded-lg border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div>
                  <Label htmlFor="versionista" className="text-sm font-medium text-gray-700 mb-2 block">
                    Versão brasileira de
                  </Label>
                  <Input
                    id="versionista"
                    value={formData.versionista}
                    onChange={(e) => handleInputChange('versionista', e.target.value)}
                    placeholder="Responsável pela versão brasileira"
                    className="rounded-lg border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div>
                  <Label htmlFor="revisao" className="text-sm font-medium text-gray-700 mb-2 block">
                    Texto revisado por
                  </Label>
                  <Input
                    id="revisao"
                    value={formData.revisao}
                    onChange={(e) => handleInputChange('revisao', e.target.value)}
                    placeholder="Responsável pela revisão"
                    className="rounded-lg border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div>
                  <Label htmlFor="versionadoEm" className="text-sm font-medium text-gray-700 mb-2 block">
                    Versionado em *
                  </Label>
                  <Input
                    id="versionadoEm"
                    type="date"
                    value={formData.versionadoEm}
                    onChange={(e) => handleInputChange('versionadoEm', e.target.value)}
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
                  <Label htmlFor="titulo_pt_br" className="text-sm font-medium text-gray-700 mb-2 block">
                    Título em Português *
                  </Label>
                  <Input
                    id="titulo_pt_br"
                    value={formData.titulo_pt_br}
                    onChange={(e) => handleInputChange('titulo_pt_br', e.target.value)}
                    placeholder="Título traduzido do verso"
                    className="rounded-lg border-gray-300 focus:border-primary"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="titulo_original" className="text-sm font-medium text-gray-700 mb-2 block">
                    Título Original
                  </Label>
                  <Input
                    id="titulo_original"
                    value={formData.titulo_original}
                    onChange={(e) => handleInputChange('titulo_original', e.target.value)}
                    placeholder="Título original do verso"
                    className="rounded-lg border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div>
                  <Label htmlFor="musical" className="text-sm font-medium text-gray-700 mb-2 block">
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
                
                <div>
                  <Label htmlFor="estilo" className="text-sm font-medium text-gray-700 mb-2 block">
                    Estilo *
                  </Label>
                  <select
                    id="estilo"
                    value={formData.estilo}
                    onChange={(e) => handleInputChange('estilo', e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary px-3 py-2"
                    required
                  >
                    <option value="">Selecione um estilo</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="valor" className="text-sm font-medium text-gray-700 mb-2 block">
                    Preço (R$) *
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => handleInputChange('valor', e.target.value)}
                    placeholder="0,00"
                    className="rounded-lg border-gray-300 focus:border-primary"
                    required
                  />
                </div>
                
                {/* Campo de Versões Irmãs */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Versões Irmãs (máximo 10)
                  </Label>
                  
                  {/* Versões selecionadas */}
                  {selectedVerses.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedVerses.map((verse) => (
                          <div key={verse.id} className="flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                            <span className="mr-2">{verse.titulo_original}</span>
                            <button
                              type="button"
                              onClick={() => removeRelatedVerse(verse.id)}
                              className="hover:bg-primary/20 rounded-full p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Botão para adicionar versão irmã */}
                  {selectedVerses.length < 10 && (
                    <div className="space-y-3">
                      {!showSearch ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowSearch(true)}
                          className="flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Adicionar Versão Irmã</span>
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          {/* Campo de busca */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <Input
                              type="text"
                              placeholder="Buscar por título original..."
                              value={searchTerm}
                              onChange={(e) => {
                                const value = e.target.value;
                                setSearchTerm(value);
                                
                                // Limpa timeout anterior
                                if (searchTimeout) {
                                  clearTimeout(searchTimeout);
                                }
                                
                                // Define novo timeout para debounce
                                const newTimeout = setTimeout(() => {
                                  handleSearchVerses(value);
                                }, 500); // 500ms de debounce
                                
                                setSearchTimeout(newTimeout);
                              }}
                              className="pl-10 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShowSearch(false);
                                setSearchTerm('');
                                setSearchResults([]);
                              }}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                          
                          {/* Resultados da busca */}
                          {isSearching && (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span className="text-sm text-gray-500">Buscando...</span>
                            </div>
                          )}
                          
                          {searchResults.length > 0 && (
                            <div className="border rounded-lg max-h-48 overflow-y-auto">
                              {searchResults.map((verse) => (
                                <button
                                  key={verse.id}
                                  type="button"
                                  onClick={() => addRelatedVerse(verse)}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                                >
                                  <div className="font-medium text-sm">{verse.titulo_original}</div>
                                  <div className="text-xs text-gray-500">{verse.musical}</div>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
                            <div className="text-center py-4 text-sm text-gray-500">
                              Nenhum verso encontrado
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedVerses.length >= 10 && (
                    <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      Limite máximo de 10 versões irmãs atingido
                    </div>
                  )}
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
              
              <div className="mt-6">
                <div>
                  <Label htmlFor="audioOriginal" className="text-sm font-medium text-gray-700 mb-2 block">
                    Áudio Original
                  </Label>
                  <Input
                    id="audioOriginal"
                    value={formData.audioOriginal}
                    onChange={(e) => handleInputChange('audioOriginal', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="rounded-lg border-gray-300 focus:border-primary"
                  />
                  {formData.audioOriginal && extractYouTubeId(formData.audioOriginal) && (
                    <div className="mt-3">
                      <p className="text-sm text-green-600 mb-2">✓ Vídeo válido detectado</p>
                      <div className="aspect-video w-full max-w-sm">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYouTubeId(formData.audioOriginal)}`}
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                          title="Preview do vídeo"
                        />
                      </div>
                    </div>
                  )}
                  {formData.audioOriginal && !extractYouTubeId(formData.audioOriginal) && (
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
            
            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4 pt-6">
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
          </form>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};

export default CreateVerse;