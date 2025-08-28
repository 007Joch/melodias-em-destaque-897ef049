import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Music, Calendar, User, FileText, Type, Upload, Image, Video, Loader2, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useNavigate, useParams } from 'react-router-dom';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { updateVerse, getVerseById, VerseFormData, searchSisterVerses, VerseSearchResult, getVersesByIds, Verse } from '../services/versesService';
import { toast } from '@/components/ui/sonner';
import PriceInput from '@/components/PriceInput';

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
    estilo: [],
    natureza: [],
    dificuldade: [],
    classificacao_vocal_alt: [],
    conteudo: '',
    audioOriginal: '',
    imageUrl: '',
    imageFile: undefined,
    valor: 0,
    ano_gravacao: undefined,
    elenco: ''
  });

  const [isPreview, setIsPreview] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);
  
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
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
    clipboard: {
      // Preservar formatação básica ao colar conteúdo do Word
      matchVisual: true
    }
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'align', 'list', 'bullet', 'blockquote', 'code-block', 'link'
  ];



  // Função para lidar com mudanças no conteúdo do ReactQuill
  const handleContentChange = (value: string) => {
    // Aplicar limpeza básica em tempo real
    const cleaned = value.replace(/\s{3,}/g, '  '); // Limitar a no máximo 2 espaços consecutivos
    handleInputChange('conteudo', cleaned);
  };

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
          estilo: Array.isArray(verseData.estilo) ? verseData.estilo : [],
          natureza: Array.isArray(verseData.natureza) ? verseData.natureza : [],
          dificuldade: Array.isArray(verseData.dificuldade) ? verseData.dificuldade : [],
          classificacao_vocal_alt: Array.isArray(verseData.classificacao_vocal_alt) ? verseData.classificacao_vocal_alt : [],
          conteudo: cleanHtmlContent(verseData.conteudo || ''),
          audioOriginal: verseData.audio_original || '',
          imageUrl: verseData.url_imagem || '',
          imageFile: undefined,
          valor: verseData.valor || 0, // Valor direto do banco
          ano_gravacao: verseData.ano_gravacao || undefined,
          elenco: verseData.elenco || ''
        });

        if (verseData.url_imagem) {
          setImagePreview(verseData.url_imagem);
        }

        // Carregar versões irmãs se existirem
        if (verseData.versoes_irmas && verseData.versoes_irmas.length > 0) {
          try {
            const sisterVersesData = await getVersesByIds(verseData.versoes_irmas);
            setSelectedSisterVerses(sisterVersesData);
            setShowSisterVersesField(true);
          } catch (error) {
            console.error('Erro ao carregar versões irmãs:', error);
          }
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
      const results = await searchSisterVerses(searchTerm, verse?.id);
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

  // Função para limpar o conteúdo HTML do ReactQuill
  const cleanHtmlContent = (htmlContent: string): string => {
    if (!htmlContent) return '';
    
    let cleaned = htmlContent;
    
    // Preservar quebras de linha múltiplas convertendo-as em parágrafos vazios
    // Detectar múltiplas quebras de linha e convertê-las em parágrafos vazios
    cleaned = cleaned.replace(/(<\/p>)\s*(<br\s*\/??>\s*){2,}\s*(<p>)/gi, '$1<p><br></p>$3');
    
    // Preservar espaçamentos intencionais entre parágrafos
    // Se há múltiplos <br> ou espaços entre </p> e <p>, manter como parágrafo vazio
    cleaned = cleaned.replace(/(<\/p>)([\s\n]*<br[^>]*>[\s\n]*)+(<p>)/gi, '$1<p><br></p>$3');
    
    // Remove apenas espaços desnecessários, mas preserva estrutura
    cleaned = cleaned.replace(/\s+</g, '<');
    cleaned = cleaned.replace(/>\s+/g, '>');
    
    // Remove espaços no início e fim de parágrafos (mas não entre eles)
    cleaned = cleaned.replace(/<p>\s+/g, '<p>');
    cleaned = cleaned.replace(/\s+<\/p>/g, '</p>');
    
    // Remove espaços extras em elementos de formatação
    cleaned = cleaned.replace(/<strong>\s+/g, '<strong>');
    cleaned = cleaned.replace(/\s+<\/strong>/g, '</strong>');
    cleaned = cleaned.replace(/<em>\s+/g, '<em>');
    cleaned = cleaned.replace(/\s+<\/em>/g, '</em>');
    
    // Remove espaços no início e fim do conteúdo total
    cleaned = cleaned.trim();
    
    return cleaned;
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
      
      // Limpar o conteúdo antes de enviar
      const cleanedFormData = {
        ...formData,
        conteudo: cleanHtmlContent(formData.conteudo)
      };
      
      const updatedVerse = await updateVerse(parseInt(id!), cleanedFormData);
      
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
    );
  }

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
                <h1 className="text-3xl font-bold text-gray-900">Editar Versão</h1>
                <p className="text-gray-600 mt-1">Edite as informações da versão musical</p>
              </div>
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
                    
                    {/* Estilo */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Estilo (máximo 10)
                      </Label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={estiloInput}
                          onChange={(e) => setEstiloInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addEstilo()}
                          placeholder="Digite um estilo"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={addEstilo}
                          disabled={!estiloInput.trim() || formData.estilo.length >= 10}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Adicionar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.estilo.map((item, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeEstilo(index)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Natureza */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Natureza (máximo 10)
                      </Label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={naturezaInput}
                          onChange={(e) => setNaturezaInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addNatureza()}
                          placeholder="Digite uma natureza"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={addNatureza}
                          disabled={!naturezaInput.trim() || formData.natureza.length >= 10}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Adicionar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.natureza.map((item, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeNatureza(index)}
                              className="text-green-600 hover:text-green-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Dificuldade */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Dificuldade (1-5, máximo 10)
                      </Label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={dificuldadeInput}
                          onChange={(e) => setDificuldadeInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addDificuldade()}
                          placeholder="Digite um número de 1 a 5"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={addDificuldade}
                          disabled={!dificuldadeInput || formData.dificuldade.length >= 10}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Adicionar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.dificuldade.map((item, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeDificuldade(index)}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Classificação Vocal */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Classificação Vocal (máximo 10)
                      </Label>
                      <div className="flex gap-2">
                        <input
                          value={classificacaoVocalInput}
                          onChange={(e) => setClassificacaoVocalInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addClassificacaoVocal()}
                          placeholder="Digite uma classificação vocal"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={addClassificacaoVocal}
                          disabled={!classificacaoVocalInput.trim() || formData.classificacao_vocal_alt.length >= 10}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Adicionar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.classificacao_vocal_alt.map((item, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeClassificacaoVocal(index)}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valor" className="text-sm font-medium text-gray-700">
                        Valor (R$)
                      </Label>
                      <PriceInput
                        value={formData.valor}
                        onChange={(value) => handleInputChange('valor', value)}
                        placeholder="0,00"
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="ano_gravacao" className="text-sm font-medium text-gray-700">
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="elenco" className="text-sm font-medium text-gray-700">
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
                          onChange={handleContentChange}
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
  );
};

export default EditVerse;
