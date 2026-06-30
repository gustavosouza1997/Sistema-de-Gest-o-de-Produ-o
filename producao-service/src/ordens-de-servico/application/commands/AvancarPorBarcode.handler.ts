import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { AvancarPorBarcodeCommand } from './AvancarPorBarcode.command';
import { ORDEM_REPOSITORY, OrdemRepository } from '../../domain/OrdemRepository.port';

const ETAPA_LABEL: Record<string, string> = {
  preparo:          'Preparo',
  costura:          'Costura',
  revisao_conserto: 'Revisão/Conserto',
  entregue:         'Entregue',
};

@CommandHandler(AvancarPorBarcodeCommand)
export class AvancarPorBarcodeHandler implements ICommandHandler<AvancarPorBarcodeCommand> {
  constructor(@Inject(ORDEM_REPOSITORY) private readonly repo: OrdemRepository) {}

  async execute(command: AvancarPorBarcodeCommand) {
    const found = await this.repo.findByCodigoBarras(command.codigoBarras);
    if (!found) throw new NotFoundException('Código de barras não encontrado em nenhum lote ativo');

    if (found.etapa === 'entregue') {
      throw new BadRequestException(`Lote "${found.identificador}" já está na etapa final (Entregue)`);
    }

    const ordem = await this.repo.findById(found.ordemId);
    const atualizada = ordem!.avancarEtapaLote(found.remessaId, found.loteId);
    await this.repo.save(atualizada);

    const remessa = atualizada.remessas.find((r) => r.id === found.remessaId);
    const lote    = remessa?.lotes.find((l) => l.id === found.loteId);

    return {
      identificador: found.identificador,
      ordemNumero:   found.ordemNumero,
      remessaNome:   found.remessaNome,
      etapaAnterior: found.etapa,
      etapaAtual:    lote?.etapa ?? found.etapa,
      etapaAnteriorLabel: ETAPA_LABEL[found.etapa],
      etapaAtualLabel:    ETAPA_LABEL[lote?.etapa ?? found.etapa],
    };
  }
}
