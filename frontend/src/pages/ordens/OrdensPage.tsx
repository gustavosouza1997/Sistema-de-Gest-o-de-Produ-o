import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, PlayCircle, CheckCircle2, XCircle, ChevronRight,
  ChevronDown, Trash2, Pencil, Check, X, ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

// ── tipos ──────────────────────────────────────────────────────────────────────
interface Empresa { id: string; razaoSocial: string; nomeFantasia?: string; }
interface Modelo  { id: string; sigla: string; linha: string; }

type EtapaFabricacao = 'preparo' | 'costura' | 'revisao_conserto' | 'entregue';

interface Lote { id: string; identificador: string; codigoBarras?: string; modeloId: string; quantidade: number; etapa: EtapaFabricacao; }
interface Remessa { id: string; nome: string; lotes: Lote[]; totalPares: number; }

interface OrdemListItem {
  id: string; empresaId: string; notaFiscalOrigem: string; numero: string;
  status: StatusOS; totalRemessas: number; totalPares: number; criadaEm: string;
}

interface OrdemDetalhe extends Omit<OrdemListItem, 'totalRemessas'> {
  remessas: Remessa[];
  abertura?: string; conclusao?: string;
}

type StatusOS = 'rascunho' | 'aberta' | 'em_execucao' | 'concluida' | 'cancelada';

// ── schemas ────────────────────────────────────────────────────────────────────
const criarSchema = z.object({
  empresaId:        z.string().min(1, 'Obrigatório'),
  notaFiscalOrigem: z.string().min(1, 'Obrigatório'),
});

const loteSchema = z.object({
  identificador: z.string().min(1, 'Obrigatório'),
  codigoBarras:  z.string().optional(),
  modeloId:      z.string().min(1, 'Obrigatório'),
  quantidade:    z.string().min(1, 'Obrigatório').transform(Number).refine((n) => n > 0, '> 0'),
});

type CriarForm = z.infer<typeof criarSchema>;
type LoteForm  = z.infer<typeof loteSchema>;

// ── helpers ────────────────────────────────────────────────────────────────────
const nomeEmpresa = (e: Empresa) => e.nomeFantasia || e.razaoSocial;

const fmtData = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return iso; }
};

const STATUS_LABEL: Record<StatusOS, string> = {
  rascunho: 'Rascunho', aberta: 'Aberta', em_execucao: 'Em execução',
  concluida: 'Concluída', cancelada: 'Cancelada',
};
const STATUS_CLASS: Record<StatusOS, string> = {
  rascunho:    'bg-gray-100 text-gray-600',
  aberta:      'bg-blue-100 text-blue-700',
  em_execucao: 'bg-amber-100 text-amber-700',
  concluida:   'bg-green-100 text-green-700',
  cancelada:   'bg-red-100 text-red-600',
};

const ETAPA_LABEL: Record<EtapaFabricacao, string> = {
  preparo:          'Preparo',
  costura:          'Costura',
  revisao_conserto: 'Revisão/Conserto',
  entregue:         'Entregue',
};
const ETAPA_CLASS: Record<EtapaFabricacao, string> = {
  preparo:          'bg-gray-100 text-gray-600',
  costura:          'bg-blue-100 text-blue-700',
  revisao_conserto: 'bg-amber-100 text-amber-700',
  entregue:         'bg-green-100 text-green-700',
};
const ETAPA_SEQ: EtapaFabricacao[] = ['preparo', 'costura', 'revisao_conserto', 'entregue'];

function StatusBadge({ status }: { status: StatusOS }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function EtapaBadge({ etapa }: { etapa: EtapaFabricacao }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ETAPA_CLASS[etapa]}`}>
      {ETAPA_LABEL[etapa]}
    </span>
  );
}

// ── página ─────────────────────────────────────────────────────────────────────
export function OrdensPage() {
  const [openModal, setOpenModal]         = useState(false);
  const [detalheId, setDetalheId]         = useState<string | null>(null);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroStatus, setFiltroStatus]   = useState('');
  const qc = useQueryClient();

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ['empresas'],
    queryFn: () => api.get('/api/empresas').then((r) => r.data ?? []),
  });

  const { data: ordens = [], isLoading } = useQuery<OrdemListItem[]>({
    queryKey: ['ordens', filtroEmpresa, filtroStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filtroEmpresa) params.set('empresaId', filtroEmpresa);
      if (filtroStatus)  params.set('status', filtroStatus);
      const qs = params.toString();
      return api.get(`/api/producao/ordens${qs ? `?${qs}` : ''}`).then((r) => r.data ?? []);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['ordens'] });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CriarForm>({
    resolver: zodResolver(criarSchema),
  });

  const criarMutation = useMutation({
    mutationFn: (data: CriarForm) => api.post('/api/producao/ordens', data),
    onSuccess: (res) => {
      invalidate();
      closeModal();
      setDetalheId(typeof res.data === 'string' ? res.data.replace(/"/g, '') : res.data);
    },
  });

  const closeModal = () => { setOpenModal(false); reset(); criarMutation.reset(); };

  const getNomeEmpresa = (id: string) => {
    const e = empresas.find((e) => e.id === id);
    return e ? nomeEmpresa(e) : '—';
  };

  const emExecucao = ordens.filter((o) => o.status === 'em_execucao').length;
  const abertas    = ordens.filter((o) => o.status === 'aberta').length;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Ordens de Serviço</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ordens.length} OS · {abertas} abertas · {emExecucao} em execução
          </p>
        </div>
        <Button onClick={() => setOpenModal(true)}>
          <Plus className="h-4 w-4" /> Nova OS
        </Button>
      </div>

      <div className="mb-4 flex gap-3">
        <Select
          options={[{ value: '', label: 'Todas as empresas' }, ...empresas.map((e) => ({ value: e.id, label: nomeEmpresa(e) }))]}
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
          className="w-52"
        />
        <Select
          options={[
            { value: '', label: 'Todos os status' },
            { value: 'rascunho', label: 'Rascunho' },
            { value: 'aberta', label: 'Aberta' },
            { value: 'em_execucao', label: 'Em execução' },
            { value: 'concluida', label: 'Concluída' },
            { value: 'cancelada', label: 'Cancelada' },
          ]}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="w-44"
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Carregando...</div>
        ) : ordens.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Nenhuma ordem de serviço</p>
            <p className="text-sm text-muted-foreground">Crie uma OS para iniciar a produção.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>NF Origem</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Remessas</TableHead>
                <TableHead className="text-right">Total pares</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordens.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => setDetalheId(o.id)}>
                  <TableCell className="font-mono text-xs font-semibold">{o.numero}</TableCell>
                  <TableCell className="font-mono text-xs">{o.notaFiscalOrigem}</TableCell>
                  <TableCell className="text-muted-foreground">{getNomeEmpresa(o.empresaId)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{o.totalRemessas}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{o.totalPares.toLocaleString('pt-BR')}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* modal criar */}
      <Modal isOpen={openModal} onClose={closeModal} title="Nova Ordem de Serviço">
        <form onSubmit={handleSubmit((d) => criarMutation.mutate(d))} className="flex flex-col gap-4 pt-2">
          <Select
            label="Empresa"
            options={empresas.map((e) => ({ value: e.id, label: nomeEmpresa(e) }))}
            placeholder="Selecione a empresa"
            error={errors.empresaId?.message}
            {...register('empresaId')}
          />
          <Input
            label="Nota Fiscal de Origem"
            placeholder="Ex: NF-001234"
            error={errors.notaFiscalOrigem?.message}
            {...register('notaFiscalOrigem')}
          />
          {criarMutation.isError && <p className="text-xs text-destructive">Erro ao criar OS.</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={criarMutation.isPending}>Criar e adicionar remessas →</Button>
          </div>
        </form>
      </Modal>

      {detalheId && (
        <OrdemDetalheModal
          ordemId={detalheId}
          getNomeEmpresa={getNomeEmpresa}
          onClose={() => setDetalheId(null)}
          onSuccess={invalidate}
        />
      )}
    </>
  );
}

// ── Modal de detalhe ───────────────────────────────────────────────────────────
function OrdemDetalheModal({ ordemId, getNomeEmpresa, onClose, onSuccess }: {
  ordemId: string;
  getNomeEmpresa: (id: string) => string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();

  const { data: modelos = [] } = useQuery<Modelo[]>({
    queryKey: ['modelos'],
    queryFn: () => api.get('/api/producao/modelos').then((r) => r.data ?? []),
  });

  const { data: ordem, isLoading } = useQuery<OrdemDetalhe>({
    queryKey: ['ordem', ordemId],
    queryFn: () => api.get(`/api/producao/ordens/${ordemId}`).then((r) => r.data),
  });

  const invalidateDetalhe = () => {
    qc.invalidateQueries({ queryKey: ['ordem', ordemId] });
    onSuccess();
  };

  const transition = useMutation({
    mutationFn: (acao: string) => api.patch(`/api/producao/ordens/${ordemId}/${acao}`),
    onSuccess: invalidateDetalhe,
  });

  const addRemessa = useMutation({
    mutationFn: (nome: string) => api.post(`/api/producao/ordens/${ordemId}/remessas`, { nome }),
    onSuccess: invalidateDetalhe,
  });

  const delRemessa = useMutation({
    mutationFn: (remessaId: string) => api.delete(`/api/producao/ordens/${ordemId}/remessas/${remessaId}`),
    onSuccess: invalidateDetalhe,
  });

  const addLote = useMutation({
    mutationFn: ({ remessaId, data }: { remessaId: string; data: LoteForm }) =>
      api.post(`/api/producao/ordens/${ordemId}/remessas/${remessaId}/lotes`, data),
    onSuccess: invalidateDetalhe,
  });

  const editLote = useMutation({
    mutationFn: ({ remessaId, loteId, data }: { remessaId: string; loteId: string; data: LoteForm }) =>
      api.patch(`/api/producao/ordens/${ordemId}/remessas/${remessaId}/lotes/${loteId}`, data),
    onSuccess: invalidateDetalhe,
  });

  const delLote = useMutation({
    mutationFn: ({ remessaId, loteId }: { remessaId: string; loteId: string }) =>
      api.delete(`/api/producao/ordens/${ordemId}/remessas/${remessaId}/lotes/${loteId}`),
    onSuccess: invalidateDetalhe,
  });

  const avancarEtapa = useMutation({
    mutationFn: ({ remessaId, loteId }: { remessaId: string; loteId: string }) =>
      api.patch(`/api/producao/ordens/${ordemId}/remessas/${remessaId}/lotes/${loteId}/avancar`),
    onSuccess: invalidateDetalhe,
  });

  const acoes: { acao: string; label: string; icon: React.ReactNode; variant?: 'default' | 'destructive' | 'outline' }[] = [];
  if (ordem?.status === 'rascunho') {
    acoes.push({ acao: 'abrir',    label: 'Abrir OS',         icon: <ChevronRight className="h-4 w-4" /> });
    acoes.push({ acao: 'cancelar', label: 'Cancelar',         icon: <XCircle className="h-4 w-4" />, variant: 'destructive' });
  }
  if (ordem?.status === 'aberta') {
    acoes.push({ acao: 'iniciar',  label: 'Iniciar execução', icon: <PlayCircle className="h-4 w-4" /> });
    acoes.push({ acao: 'cancelar', label: 'Cancelar',         icon: <XCircle className="h-4 w-4" />, variant: 'destructive' });
  }
  if (ordem?.status === 'em_execucao') {
    acoes.push({ acao: 'concluir', label: 'Concluir',         icon: <CheckCircle2 className="h-4 w-4" /> });
    acoes.push({ acao: 'cancelar', label: 'Cancelar',         icon: <XCircle className="h-4 w-4" />, variant: 'destructive' });
  }

  const isMutating = delRemessa.isPending || addLote.isPending || editLote.isPending || delLote.isPending || avancarEtapa.isPending;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={ordem ? `${ordem.numero} — NF ${ordem.notaFiscalOrigem}` : 'Carregando...'}
      description={ordem ? getNomeEmpresa(ordem.empresaId) : undefined}
      className="max-w-3xl"
    >
      {isLoading || !ordem ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <div className="flex flex-col gap-5 pt-2">

          <div className="grid grid-cols-4 gap-3 rounded-md bg-muted/40 p-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={ordem.status} /></div>
            <div><p className="text-xs text-muted-foreground">Total pares</p><p className="font-medium">{ordem.totalPares.toLocaleString('pt-BR')}</p></div>
            <div><p className="text-xs text-muted-foreground">Remessas</p><p className="font-medium">{ordem.remessas.length}</p></div>
            <div><p className="text-xs text-muted-foreground">Criada em</p><p className="font-medium">{fmtData(ordem.criadaEm)}</p></div>
            {ordem.abertura && <div><p className="text-xs text-muted-foreground">Abertura</p><p className="font-medium">{fmtData(ordem.abertura)}</p></div>}
            {ordem.conclusao && <div><p className="text-xs text-muted-foreground">Conclusão</p><p className="font-medium">{fmtData(ordem.conclusao)}</p></div>}
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Remessas</h3>
              <AddRemessaInline onAdd={(nome) => addRemessa.mutate(nome)} isPending={addRemessa.isPending} />
            </div>

            {ordem.remessas.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">Nenhuma remessa ainda.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {ordem.remessas.map((remessa) => (
                  <RemessaCard
                    key={remessa.id}
                    remessa={remessa}
                    modelos={modelos}
                    onDelete={() => delRemessa.mutate(remessa.id)}
                    onAddLote={(data) => addLote.mutate({ remessaId: remessa.id, data })}
                    onEditLote={(loteId, data) => editLote.mutate({ remessaId: remessa.id, loteId, data })}
                    onDeleteLote={(loteId) => delLote.mutate({ remessaId: remessa.id, loteId })}
                    onAvancarEtapa={(loteId) => avancarEtapa.mutate({ remessaId: remessa.id, loteId })}
                    isMutating={isMutating}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
            {transition.isError && <span className="self-center text-xs text-destructive">Erro ao atualizar status</span>}
            {acoes.map((a) => (
              <Button key={a.acao} variant={a.variant ?? 'default'} isLoading={transition.isPending} onClick={() => transition.mutate(a.acao)}>
                {a.icon}{a.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Inline: adicionar remessa ──────────────────────────────────────────────────
function AddRemessaInline({ onAdd, isPending }: { onAdd: (nome: string) => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');

  const submit = () => {
    if (!nome.trim()) return;
    onAdd(nome.trim());
    setNome('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
        <Plus className="h-3 w-3" /> Adicionar remessa
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
        placeholder="Ex: Remessa 1"
        className="h-7 w-36 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button onClick={submit} disabled={isPending} className="rounded p-1 text-green-600 hover:bg-green-100 disabled:opacity-50"><Check className="h-3.5 w-3.5" /></button>
      <button onClick={() => setOpen(false)} className="rounded p-1 text-muted-foreground hover:bg-accent"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

// ── Card de remessa ────────────────────────────────────────────────────────────
function RemessaCard({ remessa, modelos, onDelete, onAddLote, onEditLote, onDeleteLote, onAvancarEtapa, isMutating }: {
  remessa: Remessa;
  modelos: Modelo[];
  onDelete: () => void;
  onAddLote: (d: LoteForm) => void;
  onEditLote: (loteId: string, d: LoteForm) => void;
  onDeleteLote: (loteId: string) => void;
  onAvancarEtapa: (loteId: string) => void;
  isMutating: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  const ultimoLote = remessa.lotes[remessa.lotes.length - 1];

  const getNomeModelo = (id: string) => {
    const m = modelos.find((m) => m.id === id);
    return m ? `${m.sigla} — ${m.linha}` : id;
  };

  return (
    <div className="rounded border border-border">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={() => setExpanded((v) => !v)} className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <span className="text-sm font-semibold">{remessa.nome}</span>
        <div className="ml-4 flex gap-5 text-xs text-muted-foreground">
          <span>Lotes: <span className="font-medium text-foreground">{remessa.lotes.length}</span></span>
          <span>Total pares: <span className="font-mono font-medium text-foreground">{remessa.totalPares.toLocaleString('pt-BR')}</span></span>
        </div>
        <button
          onClick={onDelete} disabled={isMutating} title="Remover remessa"
          className="ml-auto rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 py-3">
          {remessa.lotes.length > 0 && (
            <div className="mb-3 overflow-x-auto rounded border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Identificador</th>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Cód. barras</th>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Modelo</th>
                    <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Qtd.</th>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Etapa</th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody>
                  {remessa.lotes.map((lote) => (
                    <LoteRow
                      key={lote.id}
                      lote={lote}
                      modelos={modelos}
                      getNomeModelo={getNomeModelo}
                      onEdit={(d) => onEditLote(lote.id, d)}
                      onDelete={() => onDeleteLote(lote.id)}
                      onAvancar={() => onAvancarEtapa(lote.id)}
                      isMutating={isMutating}
                    />
                  ))}
                </tbody>
                <tfoot className="border-t border-border bg-muted/30">
                  <tr>
                    <td className="px-2 py-1.5 text-xs font-medium text-muted-foreground" colSpan={2}>Total</td>
                    <td className="px-2 py-1.5 text-right font-mono text-xs font-semibold">{remessa.totalPares.toLocaleString('pt-BR')}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <AddLoteInline
            modelos={modelos}
            defaultValues={ultimoLote ? { modeloId: ultimoLote.modeloId, quantidade: String(ultimoLote.quantidade) } : undefined}
            onAdd={onAddLote}
            isPending={isMutating}
          />
        </div>
      )}
    </div>
  );
}

// ── Linha de lote ──────────────────────────────────────────────────────────────
function LoteRow({ lote, modelos, getNomeModelo, onEdit, onDelete, onAvancar, isMutating }: {
  lote: Lote;
  modelos: Modelo[];
  getNomeModelo: (id: string) => string;
  onEdit: (d: LoteForm) => void;
  onDelete: () => void;
  onAvancar: () => void;
  isMutating: boolean;
}) {
  const [editMode, setEditMode] = useState(false);
  const { register, handleSubmit } = useForm<LoteForm>({
    resolver: zodResolver(loteSchema),
    defaultValues: {
      identificador: lote.identificador,
      codigoBarras:  lote.codigoBarras ?? '',
      modeloId:      lote.modeloId,
      quantidade:    String(lote.quantidade) as unknown as number,
    },
  });

  const isUltima = ETAPA_SEQ.indexOf(lote.etapa) === ETAPA_SEQ.length - 1;
  const proximaEtapa = !isUltima ? ETAPA_LABEL[ETAPA_SEQ[ETAPA_SEQ.indexOf(lote.etapa) + 1]] : '';

  if (editMode) {
    return (
      <tr className="border-t border-border bg-muted/20">
        <td className="px-2 py-1" colSpan={5}>
          <form onSubmit={handleSubmit((d) => { onEdit(d); setEditMode(false); })} className="flex flex-wrap items-end gap-2">
            <input
              placeholder="Identificador"
              className="h-7 w-24 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              {...register('identificador')}
            />
            <input
              placeholder="Cód. barras"
              className="h-7 w-28 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              {...register('codigoBarras')}
            />
            <select
              className="h-7 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              {...register('modeloId')}
            >
              <option value="">Modelo</option>
              {modelos.map((m) => <option key={m.id} value={m.id}>{m.sigla} — {m.linha}</option>)}
            </select>
            <input
              type="number" placeholder="Qtd."
              className="h-7 w-20 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              {...register('quantidade')}
            />
            <div className="flex gap-1">
              <button type="submit" disabled={isMutating} className="rounded p-1 text-green-600 hover:bg-green-100"><Check className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => setEditMode(false)} className="rounded p-1 text-muted-foreground hover:bg-accent"><X className="h-3.5 w-3.5" /></button>
            </div>
          </form>
        </td>
        <td />
      </tr>
    );
  }

  return (
    <tr className="group border-t border-border">
      <td className="px-2 py-1.5 font-medium">{lote.identificador}</td>
      <td className="px-2 py-1.5 font-mono text-muted-foreground">{lote.codigoBarras || <span className="text-muted-foreground/40">—</span>}</td>
      <td className="px-2 py-1.5 text-muted-foreground">{getNomeModelo(lote.modeloId)}</td>
      <td className="px-2 py-1.5 text-right font-mono">{lote.quantidade.toLocaleString('pt-BR')}</td>
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <EtapaBadge etapa={lote.etapa} />
          {!isUltima && (
            <button
              onClick={onAvancar} disabled={isMutating} title={`Avançar para ${proximaEtapa}`}
              className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>
      <td className="px-2 py-1.5">
        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => setEditMode(true)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={onDelete} disabled={isMutating} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Inline: adicionar lote ────────────────────────────────────────────────────
function AddLoteInline({ modelos, defaultValues, onAdd, isPending }: {
  modelos: Modelo[];
  defaultValues?: { modeloId: string; quantidade: string };
  onAdd: (d: LoteForm) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoteForm>({
    resolver: zodResolver(loteSchema),
    defaultValues: {
      modeloId:  defaultValues?.modeloId  ?? '',
      quantidade: defaultValues?.quantidade as unknown as number ?? undefined,
    },
  });

  const submit = (d: LoteForm) => {
    onAdd(d);
    reset({ modeloId: d.modeloId, quantidade: d.quantidade });
    setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
        <Plus className="h-3 w-3" /> Adicionar lote
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-muted-foreground">Identificador</label>
        <input
          autoFocus placeholder="Ex: 34-36"
          className="h-7 w-24 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          {...register('identificador')}
        />
        {errors.identificador && <span className="text-xs text-destructive">{errors.identificador.message}</span>}
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-muted-foreground">Cód. barras</label>
        <input
          placeholder="Opcional"
          className="h-7 w-28 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          {...register('codigoBarras')}
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-muted-foreground">Modelo</label>
        <select
          className="h-7 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          {...register('modeloId')}
        >
          <option value="">Selecione</option>
          {modelos.map((m) => <option key={m.id} value={m.id}>{m.sigla} — {m.linha}</option>)}
        </select>
        {errors.modeloId && <span className="text-xs text-destructive">{errors.modeloId.message}</span>}
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-muted-foreground">Qtd. pares</label>
        <input
          type="number" placeholder="100"
          className="h-7 w-20 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          {...register('quantidade')}
        />
        {errors.quantidade && <span className="text-xs text-destructive">{String(errors.quantidade.message)}</span>}
      </div>
      <div className="flex gap-1 pb-0.5">
        <Button type="submit" size="sm" isLoading={isPending}>Adicionar</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
      </div>
    </form>
  );
}
