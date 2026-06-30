import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { EtapaFabricacao } from '../../domain/Lote';
import { RemessaEntity } from './RemessaEntity';

@Entity('lotes')
export class LoteEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'remessa_id' })
  remessaId: string;

  @Column()
  identificador: string;

  @Column({ name: 'codigo_barras', nullable: true, unique: true })
  codigoBarras?: string;

  @Column({ name: 'modelo_id' })
  modeloId: string;

  @Column()
  quantidade: number;

  @Column({ default: 'preparo' })
  etapa: EtapaFabricacao;

  @ManyToOne(() => RemessaEntity, (r) => r.lotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'remessa_id' })
  remessa: RemessaEntity;
}
