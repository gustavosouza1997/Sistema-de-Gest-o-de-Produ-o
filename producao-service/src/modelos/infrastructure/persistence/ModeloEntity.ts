import {
  Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryColumn, UpdateDateColumn,
} from 'typeorm';
import { OperacaoEntity } from './OperacaoEntity';
import { ReferenciaEntity } from './ReferenciaEntity';

@Entity('modelos')
@Index(['empresaId', 'sigla'], { unique: true })
export class ModeloEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id' })
  @Index()
  empresaId: string;

  @Column()
  sigla: string;

  @Column()
  linha: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  preco: number;

  @Column({ name: 'producao_por_dia' })
  producaoPorDia: number;

  @Column()
  turno: number;

  @Column({ name: 'custo_por_minuto_previsto', type: 'decimal', precision: 10, scale: 3 })
  custoPorMinutoPrevisto: number;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  @OneToMany(() => OperacaoEntity, (op) => op.modelo, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  operacoes: OperacaoEntity[];

  @OneToMany(() => ReferenciaEntity, (r) => r.modelo, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  referencias: ReferenciaEntity[];
}
