import { Controller, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AvancarPorBarcodeCommand } from '../../application/commands/AvancarPorBarcode.command';

@Controller('producao/lotes')
export class LoteController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch('barcode/:codigo/avancar')
  avancarPorBarcode(@Param('codigo') codigo: string) {
    return this.commandBus.execute(new AvancarPorBarcodeCommand(codigo));
  }
}
