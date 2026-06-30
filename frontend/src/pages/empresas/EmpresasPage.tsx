import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, AlertCircle, Pencil, PowerOff, Power } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

// ── Máscaras ───────────────────────────────────────────────────────────────
function applyMask(raw: string, mask: string): string {
  const digits = raw.replace(/\D/g, '');
  let result = '';
  let di = 0;
  for (let i = 0; i < mask.length && di < digits.length; i++) {
    result += mask[i] === '0' ? digits[di++] : mask[i];
  }
  return result;
}

function applyTelefoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) return applyMask(digits, '(00) 0000-0000');
  return applyMask(digits, '(00) 00000-0000');
}

const MASKS = {
  cnpj: '00.000.000/0000-00',
  cep:  '00000-000',
  cnae: '00.00-0/00',
};

interface MaskedFieldProps {
  label?: string;
  error?: string;
  placeholder?: string;
  mask: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}
function MaskedField({ label, error, placeholder, mask, value, onChange, onBlur }: MaskedFieldProps) {
  return (
    <Input
      label={label}
      error={error}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(applyMask(e.target.value, mask))}
      onBlur={onBlur}
    />
  );
}

// ── Constantes ─────────────────────────────────────────────────────────────
const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
].map((uf) => ({ value: uf, label: uf }));

const CRT_OPTIONS = [
  { value: '1', label: '1 – Simples Nacional' },
  { value: '2', label: '2 – Simples Nacional – Excesso de sublimite' },
  { value: '3', label: '3 – Regime Normal' },
];
const CRT_LABELS: Record<string, string> = {
  '1': 'Simples Nacional', '2': 'Simples – Excesso', '3': 'Regime Normal',
};

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Endereco {
  cep?: string; logradouro?: string; numero?: string;
  complemento?: string; bairro?: string; cidade?: string; uf?: string;
}
interface Empresa {
  id: string; razaoSocial: string; nomeFantasia?: string; cnpj: string;
  cnae?: string; inscricaoMunicipal?: string; inscricaoEstadual?: string; crt?: number;
  telefone?: string; email?: string; endereco?: Endereco; observacoes?: string;
  ativo: boolean;
}

// ── Schema ─────────────────────────────────────────────────────────────────
const schema = z.object({
  razaoSocial:        z.string().min(1, 'Obrigatório'),
  nomeFantasia:       z.string().optional(),
  cnpj:               z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Formato inválido'),
  cnae:               z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  inscricaoEstadual:  z.string().optional(),
  crt:                z.enum(['1', '2', '3']).optional(),
  telefone:           z.string().optional(),
  email:              z.string().email('E-mail inválido').optional().or(z.literal('')),
  endereco: z.object({
    cep:         z.string().optional(),
    logradouro:  z.string().optional(),
    numero:      z.string().optional(),
    complemento: z.string().optional(),
    bairro:      z.string().optional(),
    cidade:      z.string().optional(),
    uf:          z.string().optional(),
  }).optional(),
  observacoes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  cnpj: '', telefone: '', cnae: '', razaoSocial: '',
  endereco: { cep: '' },
};

function mapToForm(e: Empresa): FormData {
  return {
    razaoSocial:        e.razaoSocial,
    nomeFantasia:       e.nomeFantasia       ?? '',
    cnpj:               e.cnpj,
    cnae:               e.cnae               ?? '',
    inscricaoMunicipal: e.inscricaoMunicipal ?? '',
    inscricaoEstadual:  e.inscricaoEstadual  ?? '',
    crt:                e.crt ? (String(e.crt) as '1' | '2' | '3') : undefined,
    telefone:           e.telefone           ?? '',
    email:              e.email              ?? '',
    endereco: {
      cep:         e.endereco?.cep         ?? '',
      logradouro:  e.endereco?.logradouro  ?? '',
      numero:      e.endereco?.numero      ?? '',
      complemento: e.endereco?.complemento ?? '',
      bairro:      e.endereco?.bairro      ?? '',
      cidade:      e.endereco?.cidade      ?? '',
      uf:          e.endereco?.uf          ?? '',
    },
    observacoes: e.observacoes ?? '',
  };
}

function buildPayload(data: FormData) {
  return {
    ...data,
    crt:                data.crt ? Number(data.crt) : undefined,
    nomeFantasia:       data.nomeFantasia       || undefined,
    cnae:               data.cnae               || undefined,
    inscricaoMunicipal: data.inscricaoMunicipal || undefined,
    inscricaoEstadual:  data.inscricaoEstadual  || undefined,
    telefone:           data.telefone           || undefined,
    email:              data.email              || undefined,
    observacoes:        data.observacoes        || undefined,
    endereco: Object.values(data.endereco ?? {}).some(Boolean) ? data.endereco : undefined,
  };
}

// ── Auxiliares ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export function EmpresasPage() {
  const [mode, setMode]                   = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing]             = useState<Empresa | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Empresa | null>(null);
  const qc = useQueryClient();

  const { data: empresas = [], isLoading } = useQuery<Empresa[]>({
    queryKey: ['empresas'],
    queryFn: () => api.get('/api/empresas').then((r) => r.data),
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/api/empresas', buildPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['empresas'] }); close(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.put(`/api/empresas/${editing!.id}`, buildPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['empresas'] }); close(); },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (empresa: Empresa) =>
      empresa.ativo
        ? api.delete(`/api/empresas/${empresa.id}`)
        : api.patch(`/api/empresas/${empresa.id}/reativar`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['empresas'] }); setConfirmDelete(null); },
  });

  const openCreate = () => {
    reset(DEFAULT_VALUES);
    setEditing(null);
    createMutation.reset();
    setMode('create');
  };

  const openEdit = (empresa: Empresa) => {
    reset(mapToForm(empresa));
    setEditing(empresa);
    updateMutation.reset();
    setMode('edit');
  };

  const close = () => {
    setMode(null);
    setEditing(null);
    reset(DEFAULT_VALUES);
    createMutation.reset();
    updateMutation.reset();
  };

  const onSubmit = (data: FormData) => {
    if (mode === 'edit') updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const activeMutation = mode === 'edit' ? updateMutation : createMutation;
  const errorMessage = activeMutation.isError
    ? (activeMutation.error as any)?.response?.data?.message ?? 'Erro ao salvar. Verifique os dados e tente novamente.'
    : null;

  return (
    <>
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Empresas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {empresas.length} {empresas.length === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova empresa
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Carregando...</div>
        ) : empresas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">Nenhuma empresa cadastrada</p>
            <p className="text-sm text-muted-foreground">Clique em "Nova empresa" para começar.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão Social</TableHead>
                <TableHead>Nome Fantasia</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>CRT</TableHead>
                <TableHead>Cidade / UF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.razaoSocial}</TableCell>
                  <TableCell className="text-muted-foreground">{e.nomeFantasia ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{e.cnpj}</TableCell>
                  <TableCell>
                    {e.crt
                      ? <Badge variant="secondary">{CRT_LABELS[String(e.crt)] ?? e.crt}</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.endereco?.cidade ? `${e.endereco.cidade}/${e.endereco.uf ?? ''}` : '—'}
                  </TableCell>
                  <TableCell><StatusBadge ativo={e.ativo} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(e)}
                        title="Editar"
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(e)}
                        title={e.ativo ? 'Desativar' : 'Reativar'}
                        className={`rounded p-1.5 transition-colors ${
                          e.ativo
                            ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                            : 'text-muted-foreground hover:bg-green-500/10 hover:text-green-600'
                        }`}
                      >
                        {e.ativo
                          ? <PowerOff className="h-3.5 w-3.5" />
                          : <Power className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal de cadastro / edição */}
      <Modal
        isOpen={mode !== null}
        onClose={close}
        title={mode === 'edit' ? 'Editar empresa' : 'Nova empresa'}
        description={
          mode === 'edit'
            ? `Editando: ${editing?.razaoSocial}`
            : 'Preencha os dados cadastrais da empresa.'
        }
        className="max-w-3xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 pt-1">

          {errorMessage && <ErrorBanner message={errorMessage} />}

          {/* Identificação */}
          <SectionLabel>Identificação</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="Razão Social" placeholder="Nome jurídico completo" error={errors.razaoSocial?.message} {...register('razaoSocial')} />
            </div>
            <Input label="Nome Fantasia" placeholder="Nome comercial" {...register('nomeFantasia')} />
            <Controller
              control={control}
              name="cnpj"
              render={({ field }) => (
                <MaskedField
                  label="CNPJ"
                  mask={MASKS.cnpj}
                  placeholder="00.000.000/0000-00"
                  error={errors.cnpj?.message}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          {/* Fiscal */}
          <SectionLabel>Fiscal</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={control}
              name="cnae"
              render={({ field }) => (
                <MaskedField
                  label="CNAE Principal"
                  mask={MASKS.cnae}
                  placeholder="00.00-0/00"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            <Select label="Regime Tributário (CRT)" options={CRT_OPTIONS} placeholder="Selecione" {...register('crt')} />
            <Input label="Inscrição Estadual" placeholder="Ex: 000/0000000" {...register('inscricaoEstadual')} />
            <Input label="Inscrição Municipal" placeholder="Opcional" {...register('inscricaoMunicipal')} />
          </div>

          {/* Endereço */}
          <SectionLabel>Endereço</SectionLabel>
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-2">
              <Controller
                control={control}
                name="endereco.cep"
                render={({ field }) => (
                  <MaskedField
                    label="CEP"
                    mask={MASKS.cep}
                    placeholder="00000-000"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            <div className="col-span-4">
              <Input label="Logradouro" placeholder="Rua, Av., Travessa..." {...register('endereco.logradouro')} />
            </div>
            <div className="col-span-1">
              <Input label="Número" placeholder="123" {...register('endereco.numero')} />
            </div>
            <div className="col-span-2">
              <Input label="Complemento" placeholder="Sala, Bloco..." {...register('endereco.complemento')} />
            </div>
            <div className="col-span-3">
              <Input label="Bairro" placeholder="Bairro" {...register('endereco.bairro')} />
            </div>
            <div className="col-span-4">
              <Input label="Cidade" placeholder="Cidade" {...register('endereco.cidade')} />
            </div>
            <div className="col-span-2">
              <Select label="UF" options={UF_OPTIONS} placeholder="UF" {...register('endereco.uf')} />
            </div>
          </div>

          {/* Contato */}
          <SectionLabel>Contato</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={control}
              name="telefone"
              render={({ field }) => (
                <Input
                  label="Telefone"
                  placeholder="(00) 0000-0000 ou (00) 00000-0000"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(applyTelefoneMask(e.target.value))}
                  onBlur={field.onBlur}
                />
              )}
            />
            <Input label="E-mail" type="email" placeholder="contato@empresa.com" error={errors.email?.message} {...register('email')} />
          </div>

          {/* Observações */}
          <SectionLabel>Observações</SectionLabel>
          <textarea
            rows={3}
            placeholder="Informações adicionais sobre a empresa"
            className="flex w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            {...register('observacoes')}
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
            <Button type="submit" isLoading={activeMutation.isPending}>
              {mode === 'edit' ? 'Salvar alterações' : 'Criar empresa'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmação de desativar / reativar */}
      <Modal
        isOpen={confirmDelete !== null}
        onClose={() => { setConfirmDelete(null); toggleStatusMutation.reset(); }}
        title={confirmDelete?.ativo ? 'Desativar empresa' : 'Reativar empresa'}
      >
        <div className="flex flex-col gap-4 pt-1">
          <p className="text-sm text-muted-foreground">
            {confirmDelete?.ativo
              ? <>Tem certeza que deseja desativar <span className="font-medium text-foreground">{confirmDelete?.razaoSocial}</span>? A empresa não será excluída, apenas marcada como inativa.</>
              : <>Deseja reativar <span className="font-medium text-foreground">{confirmDelete?.razaoSocial}</span>?</>
            }
          </p>
          {toggleStatusMutation.isError && (
            <ErrorBanner
              message={(toggleStatusMutation.error as any)?.response?.data?.message ?? 'Erro ao alterar status da empresa.'}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setConfirmDelete(null); toggleStatusMutation.reset(); }}
            >
              Cancelar
            </Button>
            <Button
              variant={confirmDelete?.ativo ? 'destructive' : 'default'}
              isLoading={toggleStatusMutation.isPending}
              onClick={() => toggleStatusMutation.mutate(confirmDelete!)}
            >
              {confirmDelete?.ativo ? 'Desativar' : 'Reativar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
