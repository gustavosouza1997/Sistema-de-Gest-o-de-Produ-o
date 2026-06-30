import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { StatusControle } from '../../domain/ControleDeProducao';
import { EtapaEntity } from './EtapaEntity';

@Entity('controles_de_producao')
export class ControleEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'ordem_id', unique: true })
  ordemId: string;

  @Column({ default: 'pendente' })
  status: StatusControle;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @Column({ name: 'iniciado_em', nullable: true, type: 'timestamptz' })
  iniciadoEm?: Date;

  @Column({ name: 'concluido_em', nullable: true, type: 'timestamptz' })
  concluidoEm?: Date;

  @OneToMany(() => EtapaEntity, (e) => e.controle, { cascade: true, eager: true })
  etapas: EtapaEntity[];
}
