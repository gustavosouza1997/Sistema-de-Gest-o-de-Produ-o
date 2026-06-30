import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default:     'bg-primary/10 text-primary',
        secondary:   'bg-secondary text-muted-foreground',
        outline:     'border border-border text-foreground',
        destructive: 'bg-destructive/10 text-destructive',
        success:     'bg-emerald-50 text-emerald-700',
        warning:     'bg-amber-50 text-amber-700',
        blue:        'bg-blue-50 text-blue-700',
      },
    },
    defaultVariants: { variant: 'secondary' },
  },
);

const STATUS_VARIANT: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
  rascunho:    'secondary',
  aberta:      'blue',
  em_execucao: 'warning',
  concluida:   'success',
  cancelada:   'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  rascunho:    'Rascunho',
  aberta:      'Aberta',
  em_execucao: 'Em execução',
  concluida:   'Concluída',
  cancelada:   'Cancelada',
  tenis:       'Tênis',
  sandalia:    'Sandália',
  bota:        'Bota',
  sapato:      'Sapato',
  chinelo:     'Chinelo',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  value?: string;
}

export function Badge({ value, variant, className, children, ...props }: BadgeProps) {
  if (value !== undefined) {
    return (
      <span className={cn(badgeVariants({ variant: STATUS_VARIANT[value] ?? 'secondary' }), className)} {...props}>
        {STATUS_LABEL[value] ?? value}
      </span>
    );
  }
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

export function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? 'success' : 'secondary'}>
      {ativo ? 'Ativo' : 'Inativo'}
    </Badge>
  );
}
