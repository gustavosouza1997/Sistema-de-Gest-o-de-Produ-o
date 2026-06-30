import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { ModeloEntity } from './ModeloEntity';
import { OperacaoAdicionalEntity } from './OperacaoAdicionalEntity';

@Entity('modelo_referencias')
export class ReferenciaEntity {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => ModeloEntity, (m) => m.referencias, { onDelete: 'CASCADE' })
  modelo: ModeloEntity;

  @Column({ name: 'modelo_id' })
  modeloId: string;

  @Column()
  nome: string;

  @OneToMany(() => OperacaoAdicionalEntity, (op) => op.referencia, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  operacoesAdicionais: OperacaoAdicionalEntity[];
}
