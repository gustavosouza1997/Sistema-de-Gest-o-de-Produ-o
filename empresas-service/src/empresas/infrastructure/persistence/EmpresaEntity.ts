import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('empresas')
export class EmpresaEntity {
  @PrimaryColumn('uuid') id: string;

  @Column({ name: 'razao_social' }) razaoSocial: string;
  @Column({ name: 'nome_fantasia', nullable: true }) nomeFantasia?: string;
  @Column({ unique: true }) cnpj: string;
  @Column({ nullable: true }) cnae?: string;
  @Column({ name: 'inscricao_municipal', nullable: true }) inscricaoMunicipal?: string;
  @Column({ name: 'inscricao_estadual', nullable: true }) inscricaoEstadual?: string;
  @Column({ type: 'smallint', nullable: true }) crt?: number;
  @Column({ nullable: true }) telefone?: string;
  @Column({ nullable: true }) email?: string;

  // Endereço (flat)
  @Column({ nullable: true }) cep?: string;
  @Column({ nullable: true }) logradouro?: string;
  @Column({ nullable: true }) numero?: string;
  @Column({ nullable: true }) complemento?: string;
  @Column({ nullable: true }) bairro?: string;
  @Column({ nullable: true }) cidade?: string;
  @Column({ length: 2, nullable: true }) uf?: string;

  @Column({ nullable: true, type: 'text' }) observacoes?: string;
  @Column({ default: true }) ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' }) criadoEm: Date;
  @UpdateDateColumn({ name: 'atualizado_em' }) atualizadoEm: Date;
}
