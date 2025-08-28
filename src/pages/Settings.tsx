import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Database } from '@/integrations/supabase/types';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ptBR } from 'date-fns/locale';

// Define o tipo da tabela de cupons a partir dos tipos gerados do Supabase
type Coupon = Database['public']['Tables']['coupons']['Row'];

const Settings: React.FC = () => {
  // Estados do aviso da homepage
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('Aviso');
  const [closeButtonLabel, setCloseButtonLabel] = useState('Entendi');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados da seção de cupons
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [newUsageLimit, setNewUsageLimit] = useState('');
  const [newEnabled, setNewEnabled] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingRow, setSavingRow] = useState<Record<string, boolean>>({});

  // Carregar configuração atual ao montar
  useEffect(() => {
    const loadNotice = async () => {
      try {
        const { data, error } = await supabase
          .from('site_notices')
          .select('enabled, message, title, close_button_label')
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setEnabled(!!data.enabled);
          setMessage(data.message || '');
          setNoticeTitle(data.title || 'Aviso');
          setCloseButtonLabel(data.close_button_label || 'Entendi');
        }
      } catch (err: any) {
        console.error('Erro ao carregar aviso do site:', err);
        toast('Erro ao carregar', { description: 'Não foi possível carregar as configurações do aviso.' });
      } finally {
        setLoading(false);
      }
    };

    const loadCoupons = async () => {
      setLoadingCoupons(true);
      try {
        const { data, error } = await supabaseAdmin
          .from('coupons')
          .select('id, code, discount_percent, expires_at, enabled, usage_limit, usage_count, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        setCoupons(data || []);
      } catch (err: any) {
        console.error('Erro ao carregar cupons:', err);
        toast('Erro ao carregar cupons', { description: err.message || 'Não foi possível carregar a lista de cupons.' });
      } finally {
        setLoadingCoupons(false);
      }
    };

    loadNotice();
    loadCoupons();
  }, []);

  // Recarregar cupons (usado após operações ou realtime)
  const reloadCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const { data, error } = await supabaseAdmin
        .from('coupons')
        .select('id, code, discount_percent, expires_at, enabled, usage_limit, usage_count, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setCoupons(data || []);
    } catch (err: any) {
      console.error('Erro ao recarregar cupons:', err);
      toast('Erro', { description: err.message || 'Falha ao recarregar cupons.' });
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_notices')
        .upsert({ id: 1, enabled, message, title: noticeTitle, close_button_label: closeButtonLabel }, { onConflict: 'id' });

      if (error) throw error;
      toast('Configurações salvas', { description: 'O aviso da homepage foi atualizado com sucesso.' });
    } catch (err: any) {
      console.error('Erro ao salvar aviso do site:', err);
      toast('Erro ao salvar', { description: err.message || 'Não foi possível salvar as configurações.' });
    } finally {
      setSaving(false);
    }
  };

  // CRUD de cupons

  const handleCreateCoupon = async () => {
    if (coupons.length >= 10) {
      toast('Limite atingido', { description: 'Você já possui 10 cupons. Exclua algum para adicionar um novo.' });
      return;
    }

    const code = newCode.trim().toUpperCase();
    const discount = Number(newDiscount);
    const usageLimit = newUsageLimit.trim() === '' ? null : Number(newUsageLimit);
    const expiresAt = newExpiresAt.trim() === '' ? null : `${newExpiresAt.trim()}T23:59:59-03:00`;

    if (!code) {
      toast('Código obrigatório', { description: 'Informe um código para o cupom.' });
      return;
    }
    if (Number.isNaN(discount) || discount <= 0 || discount > 100) {
      toast('Percentual inválido', { description: 'O percentual deve estar entre 1 e 100.' });
      return;
    }
    if (usageLimit !== null && (Number.isNaN(usageLimit) || usageLimit < 1)) {
      toast('Limite inválido', { description: 'O limite de uso deve ser um número positivo.' });
      return;
    }

    if (newExpiresAt && !validateExpirationDate(newExpiresAt)) {
      toast('Data inválida', { description: 'A data de expiração não pode ser anterior ao dia atual.' });
      return;
    }

    setCreating(true);
    try {
      // Verificação prévia de duplicidade (case-insensitive)
      const { data: existing, error: checkError } = await supabase
        .from('coupons')
        .select('id')
        .ilike('code', code)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // Erro inesperado ao checar duplicidade (ignora "no rows" de maybeSingle)
        throw checkError;
      }

      if (existing) {
        toast('Código já existe', { description: 'Escolha outro código de cupom, este já está em uso.' });
        return;
      }

      const { error } = await supabaseAdmin.from('coupons').insert({
        code,
        discount_percent: discount,
        expires_at: expiresAt,
        enabled: newEnabled,
        usage_limit: usageLimit,
      });
      if (error) throw error;
      toast('Cupom criado', { description: `O cupom ${code} foi adicionado.` });
      // Limpar formulário
      setNewCode('');
      setNewDiscount('');
      setNewExpiresAt('');
      setNewEnabled(true);
      setNewUsageLimit('');
      await reloadCoupons();
    } catch (err: any) {
      console.error('Erro ao criar cupom:', err);
      if (err?.code === '23505') {
        toast('Código já existe', { description: 'Escolha outro código de cupom, este já está em uso.' });
      } else {
        toast('Erro ao criar', { description: err.message || 'Não foi possível criar o cupom.' });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCoupon = async (c: Coupon) => {
    setSavingRow((prev) => ({ ...prev, [c.id]: true }));
    try {
      const normalizedExpiresAt = c.expires_at
        ? (c.expires_at.length === 10 ? `${c.expires_at}T23:59:59-03:00` : c.expires_at)
        : null;

      if (c.expires_at && !validateExpirationDate(c.expires_at.length === 10 ? c.expires_at : formatDateForInput(c.expires_at))) {
        throw new Error('A data de expiração não pode ser anterior ao dia atual.');
      }

      const { error } = await supabase
        .from('coupons')
        .update({
          discount_percent: c.discount_percent,
          expires_at: normalizedExpiresAt,
          enabled: c.enabled,
          usage_limit: c.usage_limit,
        })
        .eq('id', c.id);
      if (error) throw error;
      toast('Cupom atualizado', { description: `As alterações em ${c.code} foram salvas.` });
      await reloadCoupons();
    } catch (err: any) {
      console.error('Erro ao atualizar cupom:', err);
      toast('Erro ao salvar', { description: err.message || 'Não foi possível salvar o cupom.' });
    } finally {
      setSavingRow((prev) => ({ ...prev, [c.id]: false }));
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir o cupom ${code}?`);
    if (!confirmed) return;
    setSavingRow((prev) => ({ ...prev, [id]: true }));
    try {
      const { data, error } = await supabaseAdmin
        .from('coupons')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        toast('Não encontrado', { description: 'Cupom não foi encontrado no banco de dados.' });
      } else {
        toast('Cupom excluído', { description: `O cupom ${code} foi removido.` });
      }

      await reloadCoupons();
    } catch (err: any) {
      console.error('Erro ao excluir cupom:', err);
      toast('Erro ao excluir', { description: err.message || 'Não foi possível excluir o cupom.' });
    } finally {
      setSavingRow((prev) => ({ ...prev, [id]: false }));
    }
  };

  const setField = (id: string, key: keyof Coupon, value: any) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)));
  };

  // Formata a data para o input type="date" considerando o fuso America/Sao_Paulo
  const formatDateForInput = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const tz = 'America/Sao_Paulo';
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  };

  // Formata a data para exibição em padrão brasileiro (dd/mm/aaaa)
  const formatDateForDisplay = (iso: string | null): string => {
    if (!iso) return 'Sem limite';
    const d = new Date(iso);
    const tz = 'America/Sao_Paulo';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: tz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  };

  // Obtém a data atual no fuso Brasil para validação de data mínima
  const getCurrentDateBrazil = (): string => {
    const now = new Date();
    const tz = 'America/Sao_Paulo';
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  };

  // Valida se a data não é anterior ao dia atual
  const validateExpirationDate = (dateString: string): boolean => {
    if (!dateString) return true; // Data vazia é permitida (sem limite)
    const currentDate = getCurrentDateBrazil();
    return dateString >= currentDate;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Área restrita a administradores. Configure opções do sistema aqui.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="notice-enabled">Aviso na Home</Label>
                    <p className="text-sm text-gray-500">Exibe um popup de aviso na página inicial.</p>
                  </div>
                  <Switch id="notice-enabled" checked={enabled} onCheckedChange={setEnabled} disabled={loading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notice-title">Título do Aviso</Label>
                  <Input
                    id="notice-title"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="Ex.: Aviso importante"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notice-message">Mensagem do Aviso</Label>
                  <Textarea
                    id="notice-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ex.: Estamos atualizando o site. Em breve voltaremos com novidades."
                    rows={4}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notice-button-label">Texto do botão (Fechar)</Label>
                  <Input
                    id="notice-button-label"
                    value={closeButtonLabel}
                    onChange={(e) => setCloseButtonLabel(e.target.value)}
                    placeholder="Ex.: Entendi"
                    disabled={loading}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={loading || saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Cupons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Cupons de Desconto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Adicionar novo cupom</Label>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <Input
                    placeholder="CÓDIGO"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    disabled={creating || loadingCoupons}
                  />
                  <Input
                    type="number"
                    placeholder="% Desconto"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    disabled={creating || loadingCoupons}
                  />
                  {/* DatePicker: substitui input type="date" para garantir formato BR e calendário pt-BR */}
                  <DatePickerBR
                    value={newExpiresAt}
                    min={getCurrentDateBrazil()}
                    onChange={setNewExpiresAt}
                    disabled={creating || loadingCoupons}
                  />
                  <Input
                    type="number"
                    placeholder="Limite de uso (opcional)"
                    value={newUsageLimit}
                    onChange={(e) => setNewUsageLimit(e.target.value)}
                    disabled={creating || loadingCoupons}
                  />
                  <div className="flex items-center gap-2">
                    <Switch checked={newEnabled} onCheckedChange={setNewEnabled} disabled={creating || loadingCoupons} />
                    <span className="text-sm text-gray-600">Habilitado</span>
                  </div>
                  <Button onClick={handleCreateCoupon} disabled={creating || loadingCoupons || coupons.length >= 10}>
                    {creating ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
                {coupons.length >= 10 && (
                  <p className="text-sm text-amber-600">Limite de 10 cupons ativos na lista atingido.</p>
                )}
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Habilitado</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead>Limite</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCoupons ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <div className="py-6 text-center text-gray-500">Carregando cupons...</div>
                        </TableCell>
                      </TableRow>
                    ) : coupons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <div className="py-6 text-center text-gray-500">Nenhum cupom cadastrado.</div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      coupons.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono">{c.code}</TableCell>
                          <TableCell className="max-w-24">
                            <Input
                              type="number"
                              value={String(c.discount_percent)}
                              onChange={(e) => setField(c.id, 'discount_percent', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell className="max-w-40">
                            {/* DatePicker na edição */}
                            <DatePickerBR
                              value={formatDateForInput(c.expires_at)}
                              min={getCurrentDateBrazil()}
                              onChange={(val) => setField(c.id, 'expires_at', val ? val : null)}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={c.enabled}
                              onCheckedChange={(val) => setField(c.id, 'enabled', val)}
                            />
                          </TableCell>
                          <TableCell>
                            {c.usage_limit === null
                              ? (c.usage_count ?? 0)
                              : Math.min(c.usage_count ?? 0, c.usage_limit ?? 0)}
                          </TableCell>
                          <TableCell className="max-w-32">
                            <Input
                              type="number"
                              value={c.usage_limit === null ? '' : String(c.usage_limit)}
                              onChange={(e) =>
                                setField(
                                  c.id,
                                  'usage_limit',
                                  e.target.value.trim() === '' ? null : Number(e.target.value)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="secondary"
                              onClick={() => handleUpdateCoupon(c)}
                              disabled={!!savingRow[c.id]}
                            >
                              {savingRow[c.id] ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteCoupon(c.id, c.code)}
                              disabled={!!savingRow[c.id]}
                            >
                              Excluir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;

// Componente reutilizável de DatePicker em pt-BR para exibir DD/MM/AAAA e produzir YYYY-MM-DD
function DatePickerBR({
  value,
  onChange,
  min,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  disabled?: boolean;
}) {
  const ymdToDate = (ymd: string): Date => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const displayBR = (ymd: string): string => {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  };
  const formatToYMDInBrazilTZ = (date: Date): string => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const selected = value ? ymdToDate(value) : undefined;
  const minDate = min ? ymdToDate(min) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left font-normal"
          disabled={disabled}
        >
          {value ? (
            <span>{displayBR(value)}</span>
          ) : (
            <span className="text-muted-foreground">dd/mm/aaaa</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarUI
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) {
              onChange('');
              return;
            }
            const ymd = formatToYMDInBrazilTZ(date);
            onChange(ymd);
          }}
          locale={ptBR}
          disabled={minDate ? { before: minDate } : undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}