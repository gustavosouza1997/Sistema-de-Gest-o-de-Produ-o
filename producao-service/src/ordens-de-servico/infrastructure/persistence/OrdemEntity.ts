import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { StatusOS } from '../../domain/OrdemDeServico';
import { RemessaEntity } from './RemessaEntity';

@Entity('ordens_de_servico')
export class OrdemEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id' })
  @Index()
  empresaId: string;

  @Column({ name: 'nota_fiscal_origem' })
  notaFiscalOrigem: string;

  @Column({ unique: true })
  numero: string;

  @Column({ default: 'rascunho' })
  status: StatusOS;

  @CreateDateColumn({ name: 'criada_em' })
  criadaEm: Date;

  @Column({ name: 'abertura', nullable: true, type: 'timestamptz' })
  abertura?: Date;

  @Column({ name: 'conclusao', nullable: true, type: 'timestamptz' })
  conclusao?: Date;

  @OneToMany(() => RemessaEntity, (r) => r.ordem, { cascade: true, eager: true, orphanedRowAction: 'delete' })
  remessas: RemessaEntity[];
}
