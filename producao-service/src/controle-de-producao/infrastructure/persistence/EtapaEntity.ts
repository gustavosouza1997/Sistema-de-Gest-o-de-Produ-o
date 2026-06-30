import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { StatusEtapa } from '../../domain/Etapa';
import { ControleEntity } from './ControleEntity';

@Entity('etapas')
export class EtapaEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'controle_id' })
  controleId: string;

  @ManyToOne(() => ControleEntity, (c) => c.etapas)
  controle: ControleEntity;

  @Column()
  nome: string;

  @Column()
  ordem: number;

  @Column({ default: 'pendente' })
  status: StatusEtapa;

  @Column({ name: 'operador_id', nullable: true })
  operadorId?: string;

  @Column({ name: 'inicio_real', nullable: true, type: 'timestamptz' })
  inicioReal?: Date;

  @Column({ name: 'conclusao_real', nullable: true, type: 'timestamptz' })
  conclusaoReal?: Date;

  @Column({ type: 'text', nullable: true })
  observacao?: string;
}
