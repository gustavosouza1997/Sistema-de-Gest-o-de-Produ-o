import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { ModeloEntity } from './ModeloEntity';

@Entity('modelo_operacoes')
export class OperacaoEntity {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => ModeloEntity, (m) => m.operacoes, { onDelete: 'CASCADE' })
  modelo: ModeloEntity;

  @Column({ name: 'modelo_id' })
  modeloId: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  tempo: number;

  @Column()
  ordem: number;
}
