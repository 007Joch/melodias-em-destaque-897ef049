import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Music, Calendar, User, FileText, Type, Upload, Image, Video, Loader2, Search, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useNavigate } from 'react-router-dom';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { createVerse, VerseFormData, searchSisterVerses, Verse, VerseSearchResult } from '../services/versesService';
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
    estilo: [],
    natureza: [],
    dificuldade: [],
    classificacao_vocal_alt: [],
    conteudo: '',
    audioOriginal: '',
    imageUrl: '',
    imageFile: undefined,
    valor: 0,
    versoes_irmas: [],
    ano_gravacao: undefined,
    elenco: ''
  });

  const [isPreview, setIsPreview] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  
  // Estados para versões irmãs
  const [showSisterVersesField, setShowSisterVersesField] = useState(false);
  const [sisterVersesSearch, setSisterVersesSearch] = useState('');
  const [sisterVersesResults, setSisterVersesResults] = useState<VerseSearchResult[]>([]);
  // Tipo específico para versões irmãs selecionadas
  type SelectedSisterVerse = {
    id: number;
    titulo_original: string;
    titulo_pt_br: string;
    musical: string;
  };
  
  const [selectedSisterVerses, setSelectedSisterVerses] = useState<SelectedSisterVerse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Estados para campos dinâmicos
  const [estiloInput, setEstiloInput] = useState('');
  const [naturezaInput, setNaturezaInput] = useState('');
  const [dificuldadeInput, setDificuldadeInput] = useState('');
  const [classificacaoVocalInput, setClassificacaoVocalInput] = useState('');
  


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

  const handleInputChange = (field: keyof VerseFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funções para gerenciar campos dinâmicos
  const addEstilo = () => {
    if (estiloInput.trim() && formData.estilo.length < 10 && !formData.estilo.includes(estiloInput.trim())) {
      setFormData(prev => ({
        ...prev,
        estilo: [...prev.estilo, estiloInput.trim()]
      }));
      setEstiloInput('');
    }
  };

  const removeEstilo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      estilo: prev.estilo.filter((_, i) => i !== index)
    }));
  };

  const addNatureza = () => {
    if (naturezaInput.trim() && formData.natureza.length < 10 && !formData.natureza.includes(naturezaInput.trim())) {
      setFormData(prev => ({
        ...prev,
        natureza: [...prev.natureza, naturezaInput.trim()]
      }));
      setNaturezaInput('');
    }
  };

  const removeNatureza = (index: number) => {
    setFormData(prev => ({
      ...prev,
      natureza: prev.natureza.filter((_, i) => i !== index)
    }));
  };

  const addDificuldade = () => {
    const num = parseInt(dificuldadeInput);
    if (!isNaN(num) && num >= 1 && num <= 5 && formData.dificuldade.length < 10 && !formData.dificuldade.includes(num)) {
      setFormData(prev => ({
        ...prev,
        dificuldade: [...prev.dificuldade, num]
      }));
      setDificuldadeInput('');
    }
  };

  const removeDificuldade = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dificuldade: prev.dificuldade.filter((_, i) => i !== index)
    }));
  };

  const addClassificacaoVocal = () => {
    if (classificacaoVocalInput.trim() && formData.classificacao_vocal_alt.length < 10 && !formData.classificacao_vocal_alt.includes(classificacaoVocalInput.trim())) {
      setFormData(prev => ({
        ...prev,
        classificacao_vocal_alt: [...prev.classificacao_vocal_alt, classificacaoVocalInput.trim()]
      }));
      setClassificacaoVocalInput('');
    }
  };

  const removeClassificacaoVocal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      classificacao_vocal_alt: prev.classificacao_vocal_alt.filter((_, i) => i !== index)
    }));
  };

  // Funções para versões irmãs
  const handleSisterVersesSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSisterVersesResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchSisterVerses(searchTerm);
      setSisterVersesResults(results);
    } catch (error) {
      console.error('Erro ao buscar versões irmãs:', error);
      toast.error('Erro ao buscar versões irmãs');
    } finally {
      setIsSearching(false);
    }
  };

  const addSisterVerse = (verse: VerseSearchResult) => {
    if (selectedSisterVerses.length >= 10) {
      toast.error('Máximo de 10 versões irmãs permitidas');
      return;
    }

    if (selectedSisterVerses.find(v => v.id === verse.id)) {
      toast.error('Esta versão já foi adicionada');
      return;
    }

    // Criar um objeto Verse mínimo com os dados disponíveis
    const verseToAdd = {
      id: verse.id,
      titulo_original: verse.titulo_original,
      titulo_pt_br: verse.titulo_pt_br,
      musical: verse.musical
    };

    const newSelectedVerses = [...selectedSisterVerses, verseToAdd];
    setSelectedSisterVerses(newSelectedVerses);
    setFormData(prev => ({
      ...prev,
      versoes_irmas: newSelectedVerses.map(v => v.id)
    }));
    setSisterVersesSearch('');
    setSisterVersesResults([]);
  };

  const removeSisterVerse = (verseId: number) => {
    const newSelectedVerses = selectedSisterVerses.filter(v => v.id !== verseId);
    setSelectedSisterVerses(newSelectedVerses);
    setFormData(prev => ({
      ...prev,
      versoes_irmas: newSelectedVerses.map(v => v.id)
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
    if (!formData.titulo_pt_br || !formData.musical || formData.estilo.length === 0 || !formData.compositor || !formData.versionadoEm) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    // Validação adicional para natureza e dificuldade
    if (formData.natureza.length === 0) {
      toast.error('Por favor, adicione pelo menos uma natureza.');
      return;
    }
    
    if (formData.dificuldade.length === 0) {
      toast.error('Por favor, adicione pelo menos um nível de dificuldade.');
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
          estilo: [],
          natureza: [],
          dificuldade: [],
          classificacao_vocal_alt: [],
          conteudo: '',
          audioOriginal: '',
          imageUrl: '',
          imageFile: undefined,
          valor: 0,
          versoes_irmas: []
        });
        setImagePreview('');
        setSelectedSisterVerses([]);
        setShowSisterVersesField(false);
        setSisterVersesSearch('');
        setSisterVersesResults([]);
        setEstiloInput('');
        setNaturezaInput('');
        setDificuldadeInput('');
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
                <h1 className="text-3xl font-bold text-gray-900">Nova Versão</h1>
                <p className="text-gray-600">Cadastre uma nova versão musical</p>
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
                
                <div>
                  <Label htmlFor="ano_gravacao" className="text-sm font-medium text-gray-700 mb-2 block">
                    Ano da Gravação
                  </Label>
                  <Input
                    id="ano_gravacao"
                    type="number"
                    min="1900"
                    max="2030"
                    value={formData.ano_gravacao || ''}
                    onChange={(e) => handleInputChange('ano_gravacao', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Ex: 2013"
                    className="rounded-lg border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div>
                  <Label htmlFor="elenco" className="text-sm font-medium text-gray-700 mb-2 block">
                    Elenco
                  </Label>
                  <Input
                    id="elenco"
                    value={formData.elenco || ''}
                    onChange={(e) => handleInputChange('elenco', e.target.value)}
                    placeholder="Ex: do elenco original da Broadway"
                    className="rounded-lg border-gray-300 focus:border-primary"
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
                    placeholder="Título traduzido da versão"
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
                    placeholder="Título original da versão"
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
                
                {/* Campo Estilo Dinâmico */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Estilo * (máximo 10)
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={estiloInput}
                      onChange={(e) => setEstiloInput(e.target.value)}
                      placeholder="Digite um estilo"
                      className="flex-1 rounded-lg border-gray-300 focus:border-primary"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEstilo())}
                    />
                    <Button
                      type="button"
                      onClick={addEstilo}
                      disabled={!estiloInput.trim() || formData.estilo.length >= 10}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.estilo.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.estilo.map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => removeEstilo(index)}
                            className="text-primary hover:text-primary/70"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campo Natureza Dinâmico */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Natureza * (máximo 10)
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={naturezaInput}
                      onChange={(e) => setNaturezaInput(e.target.value)}
                      placeholder="Digite uma natureza"
                      className="flex-1 rounded-lg border-gray-300 focus:border-primary"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNatureza())}
                    />
                    <Button
                      type="button"
                      onClick={addNatureza}
                      disabled={!naturezaInput.trim() || formData.natureza.length >= 10}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.natureza.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.natureza.map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => removeNatureza(index)}
                            className="text-green-800 hover:text-green-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campo Dificuldade Dinâmico */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Dificuldade * (1-5, máximo 10 níveis)
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={dificuldadeInput}
                      onChange={(e) => setDificuldadeInput(e.target.value)}
                      placeholder="Digite um nível (1-5)"
                      className="flex-1 rounded-lg border-gray-300 focus:border-primary"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDificuldade())}
                    />
                    <Button
                      type="button"
                      onClick={addDificuldade}
                      disabled={!dificuldadeInput || formData.dificuldade.length >= 10}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.dificuldade.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.dificuldade.map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-sm"
                        >
                          {item} de 5
                          <button
                            type="button"
                            onClick={() => removeDificuldade(index)}
                            className="text-orange-800 hover:text-orange-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campo Classificação Vocal Dinâmico */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Classificação Vocal (máximo 10)
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={classificacaoVocalInput}
                      onChange={(e) => setClassificacaoVocalInput(e.target.value)}
                      placeholder="Digite uma classificação vocal"
                      className="flex-1 rounded-lg border-gray-300 focus:border-primary"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addClassificacaoVocal())}
                    />
                    <Button
                      type="button"
                      onClick={addClassificacaoVocal}
                      disabled={!classificacaoVocalInput.trim() || formData.classificacao_vocal_alt.length >= 10}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.classificacao_vocal_alt.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.classificacao_vocal_alt.map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => removeClassificacaoVocal(index)}
                            className="text-purple-800 hover:text-purple-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
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
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Versões Irmãs (Opcional)
                    </Label>
                    {!showSisterVersesField && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSisterVersesField(true)}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar Versões Irmãs</span>
                      </Button>
                    )}
                  </div>
                  
                  {showSisterVersesField && (
                    <div className="space-y-4">
                      {/* Campo de busca */}
                      <div className="relative">
                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Buscar por título original..."
                              value={sisterVersesSearch}
                              onChange={(e) => {
                                setSisterVersesSearch(e.target.value);
                                handleSisterVersesSearch(e.target.value);
                              }}
                              className="pl-10 rounded-lg border-gray-300 focus:border-primary"
                            />
                            {isSearching && (
                              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowSisterVersesField(false);
                              setSisterVersesSearch('');
                              setSisterVersesResults([]);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Resultados da busca */}
                        {sisterVersesResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {sisterVersesResults.map((verse) => (
                              <div
                                key={verse.id}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => addSisterVerse(verse)}
                              >
                                <div className="font-medium text-gray-900">{verse.titulo_original}</div>
                                <div className="text-sm text-gray-600">{verse.musical}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Versões selecionadas */}
                      {selectedSisterVerses.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">
                            Versões Irmãs Selecionadas ({selectedSisterVerses.length}/10):
                          </div>
                          <div className="space-y-2">
                            {selectedSisterVerses.map((verse) => (
                              <div
                                key={verse.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                              >
                                <div>
                                  <div className="font-medium text-gray-900">{verse.titulo_original}</div>
                                  <div className="text-sm text-gray-600">{verse.musical}</div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSisterVerse(verse.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Thumbnail da Versão
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
                <h2 className="text-xl font-semibold text-gray-900">Conteúdo da Versão</h2>
                <div className="text-sm text-gray-500 ml-auto">
                  Editor visual com formatação completa
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">💡 Dica de Uso</h3>
                  <p className="text-sm text-blue-800">
                    Use este editor para formatar todo o conteúdo da versão. Você pode:
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
                    placeholder="Digite ou cole o conteúdo da versão aqui. Use as ferramentas de formatação para destacar personagens, indicações cênicas, etc."
                    style={{ minHeight: '300px' }}
                  />
                </div>
              </div>
            </Card>
            
            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4 pt-6">

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
                    Salvar Versão
                  </>
                )}
              </Button>
            </div>
          </form>
        </main>

        <Footer />
      </div>
  );
};

export default CreateVerse;