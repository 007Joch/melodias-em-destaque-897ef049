<<<<<<< HEAD
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
=======

import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createVerse, VerseFormData } from "@/services/versesService";
import { useAppCache } from "@/hooks/useAppCache";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon, Music2, PencilRuler, StickyNote } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import PriceInput from "@/components/PriceInput";

const formSchema = z.object({
  // Informações do Musical
  compositor: z.string(),
  letraOriginal: z.string().min(1, {
    message: "Por favor, insira a letra original.",
  }),
  letrista: z.string(),
  versionista: z.string(),
  revisao: z.string(),
  versionadoEm: z.string(),
  
  // Informações do Produto
  titulo_pt_br: z.string().min(1, {
    message: "Por favor, insira o título em português.",
  }),
  titulo_original: z.string().optional(),
  musical: z.string().min(1, {
    message: "Por favor, insira o nome do musical.",
  }),
  estilo: z.string().min(1, {
    message: "Por favor, selecione um estilo.",
  }),
  valor: z.number(),
  
  // Conteúdo e mídia
  conteudo: z.string().min(1, {
    message: "Por favor, insira o conteúdo da música.",
  }),
  imageUrl: z.string().optional(),
  imageFile: z.any().optional(),
  audioOriginal: z.string().optional(),
});
>>>>>>> 5ea2d73f07b9afa220be99574d063cee53bbf8f6

const CreateVerse = () => {
  const [isImageUploadActive, setIsImageUploadActive] = useState(false);
  const navigate = useNavigate();
<<<<<<< HEAD
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
    
=======
  const { invalidateQueries } = useAppCache();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      compositor: "",
      letraOriginal: "",
      letrista: "",
      versionista: "",
      revisao: "",
      versionadoEm: "",
      titulo_pt_br: "",
      titulo_original: "",
      musical: "",
      estilo: "",
      valor: 0,
      conteudo: "",
      imageUrl: "",
      imageFile: null,
      audioOriginal: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
>>>>>>> 5ea2d73f07b9afa220be99574d063cee53bbf8f6
    try {
      console.log('Dados do formulário:', values);
      
<<<<<<< HEAD
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
=======
      // Converter o valor do preço para um número
      const valorNumerico = typeof values.valor === 'string' ? parseFloat(values.valor) : values.valor;
      
      // Criar um objeto VerseFormData com os valores do formulário
      const verseData: VerseFormData = {
        compositor: values.compositor || "",
        letraOriginal: values.letraOriginal,
        letrista: values.letrista || "",
        versionista: values.versionista || "",
        revisao: values.revisao || "",
        versionadoEm: values.versionadoEm || "",
        titulo_pt_br: values.titulo_pt_br,
        titulo_original: values.titulo_original,
        musical: values.musical,
        estilo: values.estilo,
        valor: valorNumerico || 0,
        conteudo: values.conteudo,
        imageFile: values.imageFile,
        imageUrl: values.imageUrl,
        audioOriginal: values.audioOriginal,
      };
      
      // Chamar a função createVerse para criar o verso
      await createVerse(verseData);
      
      // Exibir um toast de sucesso
      toast({
        title: "Sucesso",
        description: "Verso criado com sucesso!",
      });
      
      // Invalidar o cache para atualizar a lista de versos
      invalidateQueries(['verses']);
      
      // Redirecionar para a página inicial
      navigate('/');
    } catch (error: any) {
      // Exibir um toast de erro
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar o verso. Por favor, tente novamente.",
        variant: "destructive",
      });
>>>>>>> 5ea2d73f07b9afa220be99574d063cee53bbf8f6
    }
  }
  
  return (
<<<<<<< HEAD
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
=======
    <div className="container max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Criar Novo Verso</h1>
      
      <Card className="shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle>Informações do Verso</CardTitle>
          <CardDescription>Preencha os campos abaixo para criar um novo verso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seção de Informações do Musical */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informações do Musical</h3>
                  
                  <FormField
                    control={form.control}
                    name="compositor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compositor</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do compositor" {...field} />
                        </FormControl>
                        <FormDescription>Nome do compositor da música.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="letrista"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Letrista</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do letrista" {...field} />
                        </FormControl>
                        <FormDescription>Nome do letrista da música.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="versionista"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Versionista</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do versionista" {...field} />
                        </FormControl>
                        <FormDescription>Nome do versionista da música.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="revisao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Revisão</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da revisão" {...field} />
                        </FormControl>
                        <FormDescription>Nome da revisão da música.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="versionadoEm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Versionado Em</FormLabel>
                        <FormControl>
                          <Input placeholder="Data da versão" {...field} />
                        </FormControl>
                        <FormDescription>Data da versão da música.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Seção de Informações do Produto */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informações do Produto</h3>
                  
                  <FormField
                    control={form.control}
                    name="titulo_pt_br"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título (PT-BR)</FormLabel>
                        <FormControl>
                          <Input placeholder="Título em português" {...field} />
                        </FormControl>
                        <FormDescription>Título da música em português.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
>>>>>>> 5ea2d73f07b9afa220be99574d063cee53bbf8f6
                  />
                  
                  <FormField
                    control={form.control}
                    name="titulo_original"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título Original</FormLabel>
                        <FormControl>
                          <Input placeholder="Título original" {...field} />
                        </FormControl>
                        <FormDescription>Título original da música.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="musical"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Musical</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do musical" {...field} />
                        </FormControl>
                        <FormDescription>Nome do musical da música.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estilo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estilo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um estilo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Teatro Musical">Teatro Musical</SelectItem>
                            <SelectItem value="Pop">Pop</SelectItem>
                            <SelectItem value="Rock">Rock</SelectItem>
                            <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                            <SelectItem value="Clássico">Clássico</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Estilo musical da música.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
<<<<<<< HEAD
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
=======
                  
                  {/* Seção de Preço */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Informações de Preço</h3>
                    
                    <FormField
                      control={form.control}
                      name="valor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço (R$)</FormLabel>
                          <FormControl>
                            <PriceInput
                              value={field.value || 0}
                              onChange={(value) => field.onChange(value)}
                              placeholder="0,00"
                            />
                          </FormControl>
                          <FormDescription>
                            Digite o preço em reais. Você pode usar vírgula ou ponto como separador decimal.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
>>>>>>> 5ea2d73f07b9afa220be99574d063cee53bbf8f6
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* Seção de Conteúdo e Mídia */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Conteúdo e Mídia</h3>
                
                <FormField
                  control={form.control}
                  name="letraOriginal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Letra Original</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Letra original da música" className="resize-none min-h-[120px]" {...field} />
                      </FormControl>
                      <FormDescription>Letra original da música no idioma original.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="conteudo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo (Letra em Português)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Conteúdo da música em português" className="resize-none min-h-[120px]" {...field} />
                      </FormControl>
                      <FormDescription>Versão em português ou conteúdo final da música.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Upload de Imagem */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Imagem de Capa
                      </FormLabel>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="image-toggle" className="text-sm">Upload de arquivo</Label>
                        <Switch
                          id="image-toggle"
                          checked={isImageUploadActive}
                          onCheckedChange={setIsImageUploadActive}
                        />
                      </div>
                    </div>
                    <FormDescription>
                      {isImageUploadActive ? "Selecione um arquivo de imagem" : "Insira uma URL de imagem"}
                    </FormDescription>
                    
                    {isImageUploadActive ? (
                      <FormField
                        control={form.control}
                        name="imageFile"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  field.onChange(file);
                                }}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  {/* Áudio Original */}
                  <div className="space-y-2">
                    <FormLabel className="flex items-center gap-2">
                      <Music2 className="h-4 w-4" />
                      Áudio Original
                    </FormLabel>
                    <FormField
                      control={form.control}
                      name="audioOriginal"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="https://exemplo.com/audio.mp3" {...field} />
                          </FormControl>
                          <FormDescription>URL do áudio original da música.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
<<<<<<< HEAD
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
=======
              
              <Separator className="my-6" />
              
              {/* Ações */}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Cancelar
                </Button>
                <Button type="submit" className="min-w-[120px]">
                  <PencilRuler className="h-4 w-4 mr-2" />
                  Criar Verso
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
>>>>>>> 5ea2d73f07b9afa220be99574d063cee53bbf8f6
  );
};

export default CreateVerse;