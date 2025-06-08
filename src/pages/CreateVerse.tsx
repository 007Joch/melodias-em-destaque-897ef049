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
  compositor: z.string().optional(),
  letraOriginal: z.string().min(1, {
    message: "Por favor, insira a letra original.",
  }),
  letrista: z.string().optional(),
  versionista: z.string().optional(),
  revisao: z.string().optional(),
  versionadoEm: z.string().optional(),
  
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

const CreateVerse = () => {
  const [isImageUploadActive, setIsImageUploadActive] = useState(false);
  const navigate = useNavigate();
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
    try {
      console.log('Dados do formulário:', values);
      
      // Converter o valor do preço para um número
      const valorNumerico = typeof values.valor === 'string' ? parseFloat(values.valor) : values.valor;
      
      // Criar um objeto VerseFormData com os valores do formulário
      const verseData: VerseFormData = {
        ...values,
        valor: valorNumerico || 0, // Usar 0 como fallback se o valor for nulo ou inválido
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
    }
  }
  
  return (
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
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* Seção de Conteúdo e Mídia */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Conteúdo e Mídia</h3>
                
                <FormField
                  control={form.control}
                  name="conteudo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Conteúdo da música" className="resize-none" {...field} />
                      </FormControl>
                      <FormDescription>Conteúdo da música.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Upload de Imagem */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>Imagem</FormLabel>
                      <FormField
                        control={form.control}
                        name="isImageUploadActive"
                        render={() => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Switch
                                checked={isImageUploadActive}
                                onCheckedChange={setIsImageUploadActive}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormDescription>
                      Selecione uma imagem para o verso.
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
                              <Input placeholder="URL da imagem" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  {/* Áudio Original */}
                  <div className="space-y-2">
                    <FormLabel>Áudio Original</FormLabel>
                    <FormField
                      control={form.control}
                      name="audioOriginal"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="URL do áudio original" {...field} />
                          </FormControl>
                          <FormDescription>URL do áudio original da música.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* Ações */}
              <div className="flex justify-end">
                <Button type="submit">Criar Verso</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateVerse;
