import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import {
  UserNote,
  fetchNotesByUser,
  createNoteForUser,
  updateNote,
  deleteNote,
  deleteNotesBatch,
} from "@/services/userNotesService";

function formatDateForInput(d: Date): string {
  // YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(value: string | null): string {
  if (!value) return "-";
  // Evitar fuso: tratar como meia-noite UTC
  const date = new Date(`${value}T00:00:00Z`);
  return date.toLocaleDateString("pt-BR");
}

export default function UserHistory() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<boolean>(false);

  const [newNote, setNewNote] = useState({
    note_date: formatDateForInput(new Date()),
    title: "",
    content: "",
  });

  const [editForm, setEditForm] = useState<{ id?: string; note_date: string; title: string; content: string }>({
    note_date: formatDateForInput(new Date()),
    title: "",
    content: "",
  });

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);
  const allSelected = notes.length > 0 && selectedIds.length === notes.length;

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchNotesByUser(userId);
        setNotes(data);
        setSelected({});
      } catch (e: any) {
        setError(e?.message || "Falha ao carregar observações");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const onCreate = async () => {
    if (!userId) return;
    if (!newNote.note_date || !newNote.title || !newNote.content) {
      setError("Preencha data, título e conteúdo.");
      return;
    }
    setLoading(true);
    try {
      const created = await createNoteForUser(userId, newNote);
      setNotes((prev) => [created, ...prev]);
      setNewNote({ note_date: formatDateForInput(new Date()), title: "", content: "" });
      setIsCreateOpen(false);
    } catch (e: any) {
      setError(e?.message || "Falha ao criar observação");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (note: UserNote) => {
    setEditForm({ id: note.id as unknown as string, note_date: note.note_date ?? "", title: note.title ?? "", content: note.content ?? "" });
    setIsEditOpen(true);
  };

  const onUpdate = async () => {
    if (!editForm.id) return;
    if (!editForm.note_date || !editForm.title || !editForm.content) {
      setError("Preencha data, título e conteúdo.");
      return;
    }
    setLoading(true);
    try {
      const updated = await updateNote(editForm.id, { note_date: editForm.note_date, title: editForm.title, content: editForm.content });
      setNotes((prev) => prev.map((n) => (String(n.id) === String(updated.id) ? updated : n)));
      setIsEditOpen(false);
    } catch (e: any) {
      setError(e?.message || "Falha ao atualizar observação");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setLoading(true);
    try {
      await deleteNote(deletingId);
      setNotes((prev) => prev.filter((n) => String(n.id) !== String(deletingId)));
      setSelected((prev) => {
        const copy = { ...prev };
        delete copy[deletingId];
        return copy;
      });
    } catch (e: any) {
      setError(e?.message || "Falha ao excluir observação");
    } finally {
      setDeletingId(null);
      setLoading(false);
    }
  };

  const confirmDeleteBatch = async () => {
    if (!selectedIds.length) return;
    setLoading(true);
    try {
      await deleteNotesBatch(selectedIds);
      setNotes((prev) => prev.filter((n) => !selectedIds.includes(String(n.id))));
      setSelected({});
      setDeletingBatch(false);
    } catch (e: any) {
      setError(e?.message || "Falha ao excluir em lote");
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      const map: Record<string, boolean> = {};
      notes.forEach((n) => (map[String(n.id)] = true));
      setSelected(map);
    } else {
      setSelected({});
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Histórico do Usuário</h1>
            <p className="text-sm text-gray-500 mt-1"><span className="font-medium">ID do usuário:</span> {userId}</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button variant="destructive" onClick={() => setDeletingBatch(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir selecionadas ({selectedIds.length})
              </Button>
            )}
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova observação
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        <Card className="p-6">
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          )}

          {!loading && notes.length === 0 && (
            <p className="text-gray-600">Nenhuma observação encontrada.</p>
          )}

          {!loading && notes.length > 0 && (
            <Table>
              <TableCaption>Observações registradas</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[48px]">
                    <Checkbox checked={allSelected} onCheckedChange={(c) => toggleAll(Boolean(c))} aria-label="Selecionar todas" />
                  </TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead className="w-[160px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note) => (
                  <TableRow key={String(note.id)}>
                    <TableCell>
                      <Checkbox
                        checked={!!selected[String(note.id)]}
                        onCheckedChange={(c) => toggleOne(String(note.id), Boolean(c))}
                        aria-label="Selecionar"
                      />
                    </TableCell>
                    <TableCell>{formatDateDisplay(note.note_date)}</TableCell>
                    <TableCell className="font-medium">{note.title}</TableCell>
                    <TableCell className="max-w-[480px] truncate text-gray-700">{note.content}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => startEdit(note)}>
                          <Pencil className="w-4 h-4 mr-1" /> Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" onClick={() => setDeletingId(String(note.id))}>
                              <Trash2 className="w-4 h-4 mr-1" /> Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir observação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta observação? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>
      <Footer />

      {/* Dialog: Nova observação */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova observação</DialogTitle>
            <DialogDescription>Preencha os campos e clique em salvar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={newNote.note_date}
                  onChange={(e) => setNewNote((p) => ({ ...p, note_date: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="Título da observação"
                  value={newNote.title}
                  onChange={(e) => setNewNote((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                placeholder="Escreva aqui..."
                value={newNote.content}
                onChange={(e) => setNewNote((p) => ({ ...p, content: e.target.value }))}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={onCreate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar observação */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar observação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={editForm.note_date}
                  onChange={(e) => setEditForm((p) => ({ ...p, note_date: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="Título da observação"
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                placeholder="Escreva aqui..."
                value={editForm.content}
                onChange={(e) => setEditForm((p) => ({ ...p, content: e.target.value }))}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={onUpdate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Excluir em lote */}
      <AlertDialog open={deletingBatch} onOpenChange={setDeletingBatch}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir observações selecionadas</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedIds.length} observação(ões)? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingBatch(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBatch}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}