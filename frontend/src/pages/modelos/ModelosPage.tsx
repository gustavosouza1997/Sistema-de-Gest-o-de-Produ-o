import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, PowerOff, Power, ChevronDown, ChevronRight, ListChecks, Trash2, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';

// ── tipos ──────────────────────────────────────────────────────────────────────
interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
}

interface ModeloListItem {
  id: string; empresaId: string; sigla: string; linha: string;
  preco: number; producaoPorDia: number; turno: number;
  custoPorMinutoPrevisto: number;
  tempoTotalBase: number; totalReferencias: number; ativo: boolean;
}

interface Operacao {
  id: string; descricao: string; tempo: number; ordem: number;
  metaPorHora: number; metaPorDia: number; pessoalCalculado: number;
}

interface ReferenciaDetalhe {
  id: string; nome: string; tempoTotal: number;
  custoPorMinutoPago: number; precoPrevisto: number;
  operacoesAdicionais: Operacao[];
}

interface ModeloDetalhe {
  id: string; empresaId: string; sigla: string; linha: string;
  preco: number; producaoPorDia: number; turno: number;
  custoPorMinutoPrevisto: number; ativo: boolean;
  tempoTotalBase: number; roteiro: Operacao[]; referencias: ReferenciaDetalhe[];
}

// ── schemas ────────────────────────────────────────────────────────────────────
const modeloSchema = z.object({
  empresaId:               z.string().min(1, 'Obrigatório'),
  sigla:                   z.string().min(1, 'Obrigatório'),
  linha:                   z.string().min(1, 'Obrigatório'),
  preco:                   z.string().min(1, 'Obrigatório'),
  producaoPorDia:          z.string().min(1, 'Obrigatório'),
  turno:                   z.string().min(1, 'Obrigatório'),
  custoPorMinutoPrevisto:  z.string().min(1, 'Obrigatório'),
});

const editSchema = z.object({
  sigla:                  z.string().min(1, 'Obrigatório'),
  linha:                  z.string().min(1, 'Obrigatório'),
  preco:                  z.string().min(1, 'Obrigatório'),
  producaoPorDia:         z.string().min(1, 'Obrigatório'),
  turno:                  z.string().min(1, 'Obrigatório'),
  custoPorMinutoPrevisto: z.string().min(1, 'Obrigatório'),
});

const operacaoSchema = z.object({
  descricao: z.string().min(1, 'Obrigatório'),
  tempo:     z.string().min(1, 'Obrigatório').transform(Number),
});

const referenciaSchema = z.object({ nome: z.string().min(1, 'Obrigatório') });

type ModeloForm    = z.infer<typeof modeloSchema>;
type EditForm      = z.infer<typeof editSchema>;
type OperacaoForm  = z.infer<typeof operacaoSchema>;
type ReferenciaForm = z.infer<typeof referenciaSchema>;

// ── helpers ────────────────────────────────────────────────────────────────────
const fmt3 = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const nomeEmpresa = (e: Empresa) => e.nomeFantasia || e.razaoSocial;

// ── componente principal ───────────────────────────────────────────────────────
export function ModelosPage() {
  const [mode, setMode]           = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing]     = useState<ModeloListItem | null>(null);
  const [detailing, setDetailing] = useState<ModeloListItem | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<ModeloListItem | null>(null);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const qc = useQueryClient();

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ['empresas'],
    queryFn: () => api.get('/api/empresas').then((r) => r.data),
  });

  const { data: modelos = [], isLoading } = useQuery<ModeloListItem[]>({
    queryKey: ['modelos', filtroEmpresa],
    queryFn: () => api.get(`/api/producao/modelos${filtroEmpresa ? `?empresaId=${filtroEmpresa}` : ''}`).then((r) => r.data),
  });

  const getEmpresa = (id: string) => empresas.find((e) => e.id === id);
  const getNomeEmpresa = (id: string) => {
    const e = getEmpresa(id);
    return e ? nomeEmpresa(e) : '—';
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['modelos'] });
    if (detailing) qc.invalidateQueries({ queryKey: ['modelo', detailing.id] });
  };

  const toggleStatusMutation = useMutation({
    mutationFn: (m: ModeloListItem) =>
      m.ativo ? api.delete(`/api/producao/modelos/${m.id}`) : api.patch(`/api/producao/modelos/${m.id}/reativar`),
    onSuccess: () => { invalidate(); setConfirmToggle(null); },
  });

  const openCreate = () => { setEditing(null); setMode('create'); };
  const openEdit   = (m: ModeloListItem) => { setEditing(m); setMode('edit'); };
  const closeForm  = () => { setMode(null); setEditing(null); };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Modelos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{modelos.length} modelo(s) encontrado(s)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo modelo
        </Button>
      </div>

      <div className="mb-4 w-56">
        <Select
          options={[
            { value: '', label: 'Todas as empresas' },
            ...empresas.map((e) => ({ value: e.id, label: nomeEmpresa(e) })),
          ]}
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Carregando...</div>
        ) : modelos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Nenhum modelo cadastrado</p>
            <p className="text-sm text-muted-foreground">Crie o primeiro modelo de calçado.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sigla</TableHead>
                <TableHead>Linha</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Tempo base</TableHead>
                <TableHead className="text-right">Refs.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelos.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs font-semibold">{m.sigla}</TableCell>
                  <TableCell className="font-medium">{m.linha}</TableCell>
                  <TableCell className="text-muted-foreground">{getNomeEmpresa(m.empresaId)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">R$ {fmt3(m.preco)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt3(m.tempoTotalBase)} min</TableCell>
                  <TableCell className="text-right text-muted-foreground">{m.totalReferencias}</TableCell>
                  <TableCell><StatusBadge ativo={m.ativo} /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDetailing(m)}
                        title="Roteiro e referências"
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <ListChecks className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(m)}
                        title="Editar"
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmToggle(m)}
                        title={m.ativo ? 'Desativar' : 'Reativar'}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {m.ativo
                          ? <PowerOff className="h-3.5 w-3.5" />
                          : <Power className="h-3.5 w-3.5 text-green-600" />}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ── Modal criar ─────────────────────────────────────────── */}
      <CriarModeloModal
        isOpen={mode === 'create'}
        onClose={closeForm}
        empresas={empresas}
        onSuccess={(id) => {
          invalidate();
          closeForm();
          // Abre detalhes imediatamente após criação para o usuário adicionar o roteiro
          qc.invalidateQueries({ queryKey: ['modelos'] }).then(() => {
            qc.fetchQuery<ModeloListItem[]>({ queryKey: ['modelos', filtroEmpresa] }).then((list) => {
              const novo = list.find((m) => m.id === id);
              if (novo) setDetailing(novo);
            }).catch(() => {});
          });
        }}
      />

      {/* ── Modal editar ─────────────────────────────────────────── */}
      {editing && (
        <EditarModeloModal
          isOpen={mode === 'edit'}
          onClose={closeForm}
          modelo={editing}
          onSuccess={invalidate}
        />
      )}

      {/* ── Modal detalhes: roteiro + referências ──────────────────── */}
      {detailing && (
        <ModeloDetalheModal
          modelo={detailing}
          onClose={() => setDetailing(null)}
          getNomeEmpresa={getNomeEmpresa}
          onSuccess={invalidate}
        />
      )}

      {/* ── Confirmação toggle status ─────────────────────────────── */}
      <Modal
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        title={confirmToggle?.ativo ? 'Desativar modelo' : 'Reativar modelo'}
      >
        <p className="text-sm text-muted-foreground">
          {confirmToggle?.ativo
            ? `Deseja desativar o modelo "${confirmToggle?.sigla} — ${confirmToggle?.linha}"?`
            : `Deseja reativar o modelo "${confirmToggle?.sigla} — ${confirmToggle?.linha}"?`}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmToggle(null)}>Cancelar</Button>
          <Button
            variant={confirmToggle?.ativo ? 'destructive' : 'default'}
            isLoading={toggleStatusMutation.isPending}
            onClick={() => confirmToggle && toggleStatusMutation.mutate(confirmToggle)}
          >
            {confirmToggle?.ativo ? 'Desativar' : 'Reativar'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ── Modal criar modelo ─────────────────────────────────────────────────────────
function CriarModeloModal({ isOpen, onClose, empresas, onSuccess }: {
  isOpen: boolean; onClose: () => void;
  empresas: Empresa[]; onSuccess: (id: string) => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ModeloForm>({
    resolver: zodResolver(modeloSchema),
  });

  const toNum = (v: string) => Number(v.replace(',', '.'));

  const mutation = useMutation({
    mutationFn: (data: ModeloForm) => api.post<string>('/api/producao/modelos', {
      ...data,
      preco:                  toNum(data.preco),
      producaoPorDia:         toNum(data.producaoPorDia),
      turno:                  toNum(data.turno),
      custoPorMinutoPrevisto: toNum(data.custoPorMinutoPrevisto),
    }),
    onSuccess: (res) => {
      const id = String(res.data).replace(/"/g, '');
      reset();
      mutation.reset();
      onSuccess(id);
    },
  });

  const close = () => { onClose(); reset(); mutation.reset(); };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Novo modelo" description="Após criar, você poderá adicionar o roteiro e as referências.">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4 pt-2">
        <Select
          label="Empresa"
          options={empresas.map((e) => ({ value: e.id, label: nomeEmpresa(e) }))}
          placeholder="Selecione a empresa"
          error={errors.empresaId?.message}
          {...register('empresaId')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Sigla" placeholder="Ex: MOD-01" error={errors.sigla?.message} {...register('sigla')} />
          <Input label="Linha" placeholder="Nome do modelo" error={errors.linha?.message} {...register('linha')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Preço (R$)" placeholder="1,135" error={errors.preco?.message} {...register('preco')} />
          <Input label="Prod./dia" placeholder="500" error={errors.producaoPorDia?.message} {...register('producaoPorDia')} />
          <Input label="Turno (min)" placeholder="528" error={errors.turno?.message} {...register('turno')} />
        </div>
        <Input label="Custo/min previsto" placeholder="0.850" error={errors.custoPorMinutoPrevisto?.message} {...register('custoPorMinutoPrevisto')} />
        {mutation.isError && <p className="text-xs text-destructive">Erro ao criar modelo.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
          <Button type="submit" isLoading={mutation.isPending}>Criar e configurar roteiro →</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal editar modelo ────────────────────────────────────────────────────────
function EditarModeloModal({ isOpen, onClose, modelo, onSuccess }: {
  isOpen: boolean; onClose: () => void;
  modelo: ModeloListItem; onSuccess: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      sigla:                  modelo.sigla,
      linha:                  modelo.linha,
      preco:                  String(modelo.preco),
      producaoPorDia:         String(modelo.producaoPorDia),
      turno:                  String(modelo.turno),
      custoPorMinutoPrevisto: String(modelo.custoPorMinutoPrevisto),
    },
  });

  const toNum = (v: string) => Number(v.replace(',', '.'));

  const mutation = useMutation({
    mutationFn: (data: EditForm) => api.patch(`/api/producao/modelos/${modelo.id}`, {
      sigla:                  data.sigla,
      linha:                  data.linha,
      preco:                  toNum(data.preco),
      producaoPorDia:         toNum(data.producaoPorDia),
      turno:                  toNum(data.turno),
      custoPorMinutoPrevisto: toNum(data.custoPorMinutoPrevisto),
    }),
    onSuccess: () => { onSuccess(); onClose(); },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar — ${modelo.sigla}`}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Sigla" error={errors.sigla?.message} {...register('sigla')} />
          <Input label="Linha" error={errors.linha?.message} {...register('linha')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Preço (R$)" error={errors.preco?.message} {...register('preco')} />
          <Input label="Prod./dia" error={errors.producaoPorDia?.message} {...register('producaoPorDia')} />
          <Input label="Turno (min)" error={errors.turno?.message} {...register('turno')} />
        </div>
        <Input label="Custo/min previsto" error={errors.custoPorMinutoPrevisto?.message} {...register('custoPorMinutoPrevisto')} />
        {mutation.isError && <p className="text-xs text-destructive">Erro ao atualizar modelo.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={mutation.isPending}>Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal detalhes: roteiro + referências ──────────────────────────────────────
function ModeloDetalheModal({ modelo, onClose, getNomeEmpresa, onSuccess }: {
  modelo: ModeloListItem; onClose: () => void;
  getNomeEmpresa: (id: string) => string; onSuccess: () => void;
}) {
  const qc = useQueryClient();

  const { data: detalhe, isLoading } = useQuery<ModeloDetalhe>({
    queryKey: ['modelo', modelo.id],
    queryFn: () => api.get(`/api/producao/modelos/${modelo.id}`).then((r) => r.data),
  });

  const invalidateDetalhe = () => {
    qc.invalidateQueries({ queryKey: ['modelo', modelo.id] });
    onSuccess();
  };

  const addOpRoteiro = useMutation({
    mutationFn: (data: OperacaoForm) => api.post(`/api/producao/modelos/${modelo.id}/roteiro`, data),
    onSuccess: invalidateDetalhe,
  });

  const addRef = useMutation({
    mutationFn: (data: ReferenciaForm) => api.post(`/api/producao/modelos/${modelo.id}/referencias`, data),
    onSuccess: invalidateDetalhe,
  });

  const editOpRoteiro = useMutation({
    mutationFn: ({ opId, data }: { opId: string; data: OperacaoForm }) =>
      api.patch(`/api/producao/modelos/${modelo.id}/roteiro/${opId}`, data),
    onSuccess: invalidateDetalhe,
  });

  const delOpRoteiro = useMutation({
    mutationFn: (opId: string) => api.delete(`/api/producao/modelos/${modelo.id}/roteiro/${opId}`),
    onSuccess: invalidateDetalhe,
  });

  const addOpRef = useMutation({
    mutationFn: ({ refId, data }: { refId: string; data: OperacaoForm }) =>
      api.post(`/api/producao/modelos/${modelo.id}/referencias/${refId}/operacoes`, data),
    onSuccess: invalidateDetalhe,
  });

  const editRef = useMutation({
    mutationFn: ({ refId, nome }: { refId: string; nome: string }) =>
      api.patch(`/api/producao/modelos/${modelo.id}/referencias/${refId}`, { nome }),
    onSuccess: invalidateDetalhe,
  });

  const delRef = useMutation({
    mutationFn: (refId: string) => api.delete(`/api/producao/modelos/${modelo.id}/referencias/${refId}`),
    onSuccess: invalidateDetalhe,
  });

  const editOpRef = useMutation({
    mutationFn: ({ refId, opId, data }: { refId: string; opId: string; data: OperacaoForm }) =>
      api.patch(`/api/producao/modelos/${modelo.id}/referencias/${refId}/operacoes/${opId}`, data),
    onSuccess: invalidateDetalhe,
  });

  const delOpRef = useMutation({
    mutationFn: ({ refId, opId }: { refId: string; opId: string }) =>
      api.delete(`/api/producao/modelos/${modelo.id}/referencias/${refId}/operacoes/${opId}`),
    onSuccess: invalidateDetalhe,
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${modelo.sigla} — ${modelo.linha}`}
      description={`${getNomeEmpresa(modelo.empresaId)} · Preço: R$ ${fmt3(modelo.preco)} · Prod/dia: ${modelo.producaoPorDia} · Turno: ${modelo.turno} min`}
      className="max-w-3xl"
    >
      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Carregando...</div>
      ) : detalhe ? (
        <div className="flex flex-col gap-6 pt-2">

          {/* ── Roteiro base ── */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Roteiro base</h3>
                {detalhe.roteiro.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tempo total: <span className="font-mono text-foreground">{fmt3(detalhe.tempoTotalBase)} min</span>
                  </p>
                )}
              </div>
              <AddOperacaoInline
                label="Adicionar operação"
                onAdd={(data) => addOpRoteiro.mutate(data)}
                isPending={addOpRoteiro.isPending}
              />
            </div>

            {detalhe.roteiro.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">Nenhuma operação. Clique em "Adicionar operação" para começar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">#</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Descrição</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Tempo (min)</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Meta/h</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Meta/dia</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Pessoal</th>
                      <th className="w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {detalhe.roteiro.map((op) => (
                      <OperacaoRow
                        key={op.id}
                        op={op}
                        onEdit={(data) => editOpRoteiro.mutate({ opId: op.id, data })}
                        onDelete={() => delOpRoteiro.mutate(op.id)}
                        isEditing={editOpRoteiro.isPending}
                        isDeleting={delOpRoteiro.isPending}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Referências ── */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Referências</h3>
              <AddReferenciaInline
                onAdd={(data) => addRef.mutate(data)}
                isPending={addRef.isPending}
              />
            </div>

            {detalhe.referencias.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">Nenhuma referência. Clique em "Adicionar referência" para começar.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {detalhe.referencias.map((ref) => (
                  <ReferenciaCard
                    key={ref.id}
                    ref_={ref}
                    onEditRef={(nome) => editRef.mutate({ refId: ref.id, nome })}
                    onDeleteRef={() => delRef.mutate(ref.id)}
                    onAddOp={(data) => addOpRef.mutate({ refId: ref.id, data })}
                    onEditOp={(opId, data) => editOpRef.mutate({ refId: ref.id, opId, data })}
                    onDeleteOp={(opId) => delOpRef.mutate({ refId: ref.id, opId })}
                    isMutating={editRef.isPending || delRef.isPending || addOpRef.isPending || editOpRef.isPending || delOpRef.isPending}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      ) : null}
    </Modal>
  );
}

// ── Linha de operação com edição/remoção inline ───────────────────────────────
function OperacaoRow({ op, onEdit, onDelete, isEditing, isDeleting }: {
  op: Operacao;
  onEdit: (d: OperacaoForm) => void;
  onDelete: () => void;
  isEditing: boolean;
  isDeleting: boolean;
}) {
  const [editMode, setEditMode] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<OperacaoForm>({
    resolver: zodResolver(operacaoSchema),
    defaultValues: { descricao: op.descricao, tempo: String(op.tempo) as unknown as number },
  });

  if (editMode) {
    return (
      <tr className="border-t border-border bg-muted/20">
        <td className="px-2 py-1.5 text-muted-foreground">{op.ordem}</td>
        <td className="px-2 py-1" colSpan={5}>
          <form onSubmit={handleSubmit((d) => { onEdit(d); setEditMode(false); })} className="flex flex-wrap items-end gap-2">
            <Input placeholder="Descrição" error={errors.descricao?.message} className="w-44 h-7 text-xs" {...register('descricao')} />
            <Input placeholder="Tempo (min)" error={errors.tempo?.message} className="w-20 h-7 text-xs" {...register('tempo')} />
            <div className="flex gap-1">
              <button type="submit" disabled={isEditing} className="rounded p-1 text-green-600 hover:bg-green-100 disabled:opacity-50">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => { setEditMode(false); reset(); }} className="rounded p-1 text-muted-foreground hover:bg-accent">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </td>
        <td />
      </tr>
    );
  }

  return (
    <tr className="group border-t border-border">
      <td className="px-2 py-1.5 text-muted-foreground">{op.ordem}</td>
      <td className="px-2 py-1.5">{op.descricao}</td>
      <td className="px-2 py-1.5 font-mono">{fmt3(op.tempo)}</td>
      <td className="px-2 py-1.5 font-mono">{fmt3(op.metaPorHora)}</td>
      <td className="px-2 py-1.5 font-mono">{fmt3(op.metaPorDia)}</td>
      <td className="px-2 py-1.5 font-mono">{fmt3(op.pessoalCalculado)}</td>
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => setEditMode(true)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={onDelete} disabled={isDeleting} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Formulário inline: adicionar operação ─────────────────────────────────────
function AddOperacaoInline({ onAdd, isPending, label = 'Adicionar operação' }: {
  onAdd: (d: OperacaoForm) => void;
  isPending: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<OperacaoForm>({
    resolver: zodResolver(operacaoSchema),
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
        <Plus className="h-3 w-3" /> {label}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit((d) => { onAdd(d); reset(); setOpen(false); })} className="flex flex-wrap items-end gap-2">
      <Input label="Descrição" placeholder="Ex: Cortar" error={errors.descricao?.message} className="w-44" {...register('descricao')} />
      <Input label="Tempo (min)" placeholder="0.500" error={errors.tempo?.message} className="w-24" {...register('tempo')} />
      <div className="flex gap-1 pb-0.5">
        <Button type="submit" size="sm" isLoading={isPending}>Adicionar</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
      </div>
    </form>
  );
}

// ── Formulário inline: adicionar referência ───────────────────────────────────
function AddReferenciaInline({ onAdd, isPending }: { onAdd: (d: ReferenciaForm) => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReferenciaForm>({
    resolver: zodResolver(referenciaSchema),
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
        <Plus className="h-3 w-3" /> Adicionar referência
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit((d) => { onAdd(d); reset(); setOpen(false); })} className="flex items-end gap-2">
      <Input label="Nome / número" placeholder="Ex: 34" error={errors.nome?.message} className="w-36" {...register('nome')} />
      <div className="flex gap-1 pb-0.5">
        <Button type="submit" size="sm" isLoading={isPending}>Adicionar</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
      </div>
    </form>
  );
}

// ── Card de referência ────────────────────────────────────────────────────────
function ReferenciaCard({ ref_, onEditRef, onDeleteRef, onAddOp, onEditOp, onDeleteOp, isMutating }: {
  ref_: ReferenciaDetalhe;
  onEditRef: (nome: string) => void;
  onDeleteRef: () => void;
  onAddOp: (d: OperacaoForm) => void;
  onEditOp: (opId: string, d: OperacaoForm) => void;
  onDeleteOp: (opId: string) => void;
  isMutating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingNome, setEditingNome] = useState(false);
  const [nomeInput, setNomeInput] = useState(ref_.nome);

  const submitNome = () => {
    if (nomeInput.trim() && nomeInput.trim() !== ref_.nome) onEditRef(nomeInput.trim());
    setEditingNome(false);
  };

  return (
    <div className="rounded border border-border">
      {/* ── cabeçalho ── */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={() => setExpanded((v) => !v)} className="shrink-0 text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {editingNome ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitNome(); if (e.key === 'Escape') setEditingNome(false); }}
              className="h-6 w-24 rounded border border-border bg-background px-1.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button onClick={submitNome} className="rounded p-0.5 text-green-600 hover:bg-green-100"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={() => { setEditingNome(false); setNomeInput(ref_.nome); }} className="rounded p-0.5 text-muted-foreground hover:bg-accent"><X className="h-3.5 w-3.5" /></button>
          </div>
        ) : (
          <button
            onClick={() => setEditingNome(true)}
            title="Clique para renomear"
            className="group flex items-center gap-1 text-sm font-semibold hover:text-primary"
          >
            {ref_.nome}
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60" />
          </button>
        )}

        <div className="flex flex-1 flex-wrap gap-x-5 gap-y-0.5 text-xs">
          <span className="text-muted-foreground">
            Tempo total:&nbsp;<span className="font-mono font-medium text-foreground">{fmt3(ref_.tempoTotal)} min</span>
          </span>
          <span className="text-muted-foreground">
            Custo/min recebido:&nbsp;<span className="font-mono font-medium text-foreground">R$ {fmt3(ref_.custoPorMinutoPago)}</span>
          </span>
          <span className="text-muted-foreground">
            Preço previsto:&nbsp;<span className="font-mono font-medium text-foreground">R$ {fmt3(ref_.precoPrevisto)}</span>
          </span>
        </div>

        <button
          onClick={onDeleteRef}
          disabled={isMutating}
          title="Remover referência"
          className="ml-auto shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── operações adicionais ── */}
      {expanded && (
        <div className="border-t border-border px-3 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Operações adicionais desta referência
          </p>

          {ref_.operacoesAdicionais.length > 0 && (
            <div className="mb-3 overflow-x-auto rounded border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">#</th>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Descrição</th>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Tempo (min)</th>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Meta/h</th>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Meta/dia</th>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Pessoal</th>
                    <th className="w-14" />
                  </tr>
                </thead>
                <tbody>
                  {ref_.operacoesAdicionais.map((op) => (
                    <OperacaoRow
                      key={op.id}
                      op={op}
                      onEdit={(d) => onEditOp(op.id, d)}
                      onDelete={() => onDeleteOp(op.id)}
                      isEditing={isMutating}
                      isDeleting={isMutating}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AddOperacaoInline label="Adicionar operação adicional" onAdd={onAddOp} isPending={isMutating} />
        </div>
      )}
    </div>
  );
}
