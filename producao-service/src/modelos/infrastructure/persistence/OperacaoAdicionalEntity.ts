import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { ReferenciaEntity } from './ReferenciaEntity';

@Entity('referencia_operacoes_adicionais')
export class OperacaoAdicionalEntity {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => ReferenciaEntity, (r) => r.operacoesAdicionais, { onDelete: 'CASCADE' })
  referencia: ReferenciaEntity;

  @Column({ name: 'referencia_id' })
  referenciaId: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  tempo: number;

  @Column()
  ordem: number;
}
