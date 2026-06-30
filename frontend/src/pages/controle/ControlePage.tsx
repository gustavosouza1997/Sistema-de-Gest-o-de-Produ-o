import { useRef, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Package, Barcode, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

// ── tipos ──────────────────────────────────────────────────────────────────────
type EtapaFabricacao = 'preparo' | 'costura' | 'revisao_conserto' | 'entregue';

interface Empresa { id: string; razaoSocial: string; nomeFantasia?: string; }
interface Modelo  { id: string; sigla: string; }

interface Lote    { id: string; identificador: string; codigoBarras?: string; modeloId: string; quantidade: number; etapa: EtapaFabricacao; }
interface Remessa { id: string; nome: string; lotes: Lote[]; }
interface Ordem   { id: string; numero: string; empresaId: string; notaFiscalOrigem: string; remessas: Remessa[]; }

interface GrupoCard {
  ordemId: string; ordemNumero: string; notaFiscalOrigem: string; empresaNome: string;
  remessaId: string; remessaNome: string; lotes: Lote[];
}

interface ScanResult {
  ok: boolean;
  identificador?: string;
  ordemNumero?: string;
  remessaNome?: string;
  etapaAnteriorLabel?: string;
  etapaAtualLabel?: string;
  erro?: string;
}

// ── constantes ────────────────────────────────────────────────────────────────
const ETAPAS: EtapaFabricacao[] = ['preparo', 'costura', 'revisao_conserto', 'entregue'];

const ETAPA_LABEL: Record<EtapaFabricacao, string> = {
  preparo:          'Preparo',
  costura:          'Costura',
  revisao_conserto: 'Revisão / Conserto',
  entregue:         'Entregue',
};

const ETAPA_COL: Record<EtapaFabricacao, { header: string; badge: string; btn: string }> = {
  preparo:          { header: 'border-t-gray-400 bg-gray-50',   badge: 'bg-gray-100 text-gray-600',   btn: 'hover:bg-gray-200 text-gray-500' },
  costura:          { header: 'border-t-blue-400 bg-blue-50',   badge: 'bg-blue-100 text-blue-700',   btn: 'hover:bg-blue-100 text-blue-600' },
  revisao_conserto: { header: 'border-t-amber-400 bg-amber-50', badge: 'bg-amber-100 text-amber-700', btn: 'hover:bg-amber-100 text-amber-600' },
  entregue:         { header: 'border-t-green-400 bg-green-50', badge: 'bg-green-100 text-green-700', btn: '' },
};

// ── helpers ───────────────────────────────────────────────────────────────────
function nomeEmpresa(e: Empresa) { return e.nomeFantasia || e.razaoSocial; }

function buildKanban(ordens: Ordem[], empresas: Empresa[]): Record<EtapaFabricacao, GrupoCard[]> {
  const k: Record<EtapaFabricacao, GrupoCard[]> = { preparo: [], costura: [], revisao_conserto: [], entregue: [] };
  for (const ordem of ordens) {
    const emp = empresas.find((e) => e.id === ordem.empresaId);
    const empresaNome = emp ? nomeEmpresa(emp) : '—';
    for (const remessa of ordem.remessas) {
      const por: Partial<Record<EtapaFabricacao, Lote[]>> = {};
      for (const lote of remessa.lotes) {
        if (!por[lote.etapa]) por[lote.etapa] = [];
        por[lote.etapa]!.push(lote);
      }
      for (const etapa of ETAPAS) {
        const lotes = por[etapa];
        if (!lotes?.length) continue;
        k[etapa].push({ ordemId: ordem.id, ordemNumero: ordem.numero, notaFiscalOrigem: ordem.notaFiscalOrigem, empresaNome, remessaId: remessa.id, remessaNome: remessa.nome, lotes });
      }
    }
  }
  return k;
}

// ── página ─────────────────────────────────────────────────────────────────────
export function ControlePage() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode]       = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ['empresas'],
    queryFn: () => api.get('/api/empresas').then((r) => r.data ?? []),
  });

  const { data: modelos = [] } = useQuery<Modelo[]>({
    queryKey: ['modelos'],
    queryFn: () => api.get('/api/producao/modelos').then((r) => r.data ?? []),
  });

  const { data: ordensAtivas = [], isLoading } = useQuery<Ordem[]>({
    queryKey: ['controle-ordens'],
    queryFn: async () => {
      const [a, b] = await Promise.all([
        api.get('/api/producao/ordens?status=aberta').then((r) => r.data ?? []),
        api.get('/api/producao/ordens?status=em_execucao').then((r) => r.data ?? []),
      ]);
      const ids = new Set<string>();
      const merged: { id: string }[] = [];
      for (const o of [...a, ...b]) { if (!ids.has(o.id)) { ids.add(o.id); merged.push(o); } }
      return Promise.all(merged.map((o) => api.get(`/api/producao/ordens/${o.id}`).then((r) => r.data)));
    },
  });

  const showResult = useCallback((result: ScanResult) => {
    setScanResult(result);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setScanResult(null), 4000);
  }, []);

  const scanMutation = useMutation({
    mutationFn: (codigo: string) =>
      api.patch(`/api/producao/lotes/barcode/${encodeURIComponent(codigo)}/avancar`).then((r) => r.data),
    onSuccess: (data) => {
      showResult({ ok: true, ...data });
      qc.invalidateQueries({ queryKey: ['controle-ordens'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Código não encontrado';
      showResult({ ok: false, erro: msg });
    },
  });

  const avancarManual = useMutation({
    mutationFn: ({ ordemId, remessaId, loteId }: { ordemId: string; remessaId: string; loteId: string }) =>
      api.patch(`/api/producao/ordens/${ordemId}/remessas/${remessaId}/lotes/${loteId}/avancar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['controle-ordens'] }),
  });

  // foco contínuo no input
  useEffect(() => { inputRef.current?.focus(); }, [ordensAtivas]);

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const codigo = barcode.trim();
    if (!codigo) return;
    setBarcode('');
    scanMutation.mutate(codigo);
  };

  const getNomeModelo = (id: string) => modelos.find((m) => m.id === id)?.sigla ?? id;
  const kanban = buildKanban(ordensAtivas, empresas);
  const totalLotes = ordensAtivas.reduce((s, o) => s + o.remessas.reduce((ss, r) => ss + r.lotes.length, 0), 0);

  return (
    <div className="flex h-full flex-col gap-3">

      {/* ── barra de leitura ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <Barcode className="h-6 w-6 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">Leitura de código de barras</p>
          <input
            ref={inputRef}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleScan}
            onBlur={() => setTimeout(() => inputRef.current?.focus(), 100)}
            placeholder="Aguardando leitura..."
            className="w-full bg-transparent text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground/40"
          />
        </div>

        {/* feedback */}
        {scanResult && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${scanResult.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
            {scanResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
            {scanResult.ok ? (
              <span>
                <strong>{scanResult.identificador}</strong>
                {' '}({scanResult.ordemNumero} / {scanResult.remessaNome}):{' '}
                {scanResult.etapaAnteriorLabel} → <strong>{scanResult.etapaAtualLabel}</strong>
              </span>
            ) : (
              <span>{scanResult.erro}</span>
            )}
          </div>
        )}

        <div className="text-right text-xs text-muted-foreground">
          <p className="font-medium">{ordensAtivas.length} OS</p>
          <p>{totalLotes} lotes</p>
        </div>
      </div>

      {/* ── kanban ─────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Carregando...</div>
      ) : ordensAtivas.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Package className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium">Nenhuma OS em produção</p>
          <p className="text-xs text-muted-foreground">Abra ou inicie uma OS para acompanhar aqui.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto">
          {ETAPAS.map((etapa) => {
            const grupos = kanban[etapa];
            const cor = ETAPA_COL[etapa];
            const isUltima = etapa === 'entregue';
            const totalPares = grupos.reduce((s, g) => s + g.lotes.reduce((ls, l) => ls + l.quantidade, 0), 0);
            const totalLotesColunas = grupos.reduce((s, g) => s + g.lotes.length, 0);

            return (
              <div key={etapa} className="flex w-72 shrink-0 flex-col gap-2">
                {/* cabeçalho */}
                <div className={`flex items-center justify-between rounded-lg border border-t-4 px-3 py-2 ${cor.header}`}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide">{ETAPA_LABEL[etapa]}</p>
                    <p className="text-xs text-muted-foreground">
                      {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} · {totalPares.toLocaleString('pt-BR')} pares
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cor.badge}`}>{totalLotesColunas}</span>
                </div>

                {/* cards */}
                <div className="flex flex-col gap-2 overflow-y-auto pb-2">
                  {grupos.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border py-8 text-center">
                      <p className="text-xs text-muted-foreground">Nenhum lote nesta etapa</p>
                    </div>
                  ) : (
                    grupos.map((grupo) => (
                      <KanbanCard
                        key={`${grupo.ordemId}-${grupo.remessaId}`}
                        grupo={grupo}
                        cor={cor}
                        isUltima={isUltima}
                        getNomeModelo={getNomeModelo}
                        isPending={avancarManual.isPending}
                        onAvancar={(loteId) => avancarManual.mutate({ ordemId: grupo.ordemId, remessaId: grupo.remessaId, loteId })}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
function KanbanCard({ grupo, cor, isUltima, getNomeModelo, isPending, onAvancar }: {
  grupo: GrupoCard;
  cor: { header: string; badge: string; btn: string };
  isUltima: boolean;
  getNomeModelo: (id: string) => string;
  isPending: boolean;
  onAvancar: (loteId: string) => void;
}) {
  const totalPares = grupo.lotes.reduce((s, l) => s + l.quantidade, 0);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/30 px-3 py-2">
        <div className="flex items-start justify-between gap-1">
          <span className="font-mono text-xs font-bold">{grupo.ordemNumero}</span>
          <span className="font-mono text-xs text-muted-foreground">NF {grupo.notaFiscalOrigem}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{grupo.empresaNome}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex rounded bg-secondary px-1.5 py-0.5 text-xs font-medium">{grupo.remessaNome}</span>
          <span className="text-xs text-muted-foreground">{totalPares.toLocaleString('pt-BR')} pares</span>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {grupo.lotes.map((lote) => (
          <div key={lote.id} className="flex items-center gap-2 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{lote.identificador}</p>
              <p className="truncate text-xs text-muted-foreground">{getNomeModelo(lote.modeloId)}</p>
              {lote.codigoBarras && (
                <p className="truncate font-mono text-xs text-muted-foreground/60">{lote.codigoBarras}</p>
              )}
            </div>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{lote.quantidade.toLocaleString('pt-BR')}p</span>
            {!isUltima && (
              <button
                onClick={() => onAvancar(lote.id)}
                disabled={isPending}
                title="Avançar manualmente"
                className={`shrink-0 rounded p-1 transition-colors disabled:opacity-40 ${cor.btn}`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
