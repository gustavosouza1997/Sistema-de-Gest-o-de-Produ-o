import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { OrdemEntity } from './OrdemEntity';
import { LoteEntity } from './LoteEntity';

@Entity('remessas')
export class RemessaEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'ordem_id' })
  ordemId: string;

  @Column()
  nome: string;

  @ManyToOne(() => OrdemEntity, (o) => o.remessas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ordem_id' })
  ordem: OrdemEntity;

  @OneToMany(() => LoteEntity, (l) => l.remessa, { cascade: true, eager: true, orphanedRowAction: 'delete' })
  lotes: LoteEntity[];
}
