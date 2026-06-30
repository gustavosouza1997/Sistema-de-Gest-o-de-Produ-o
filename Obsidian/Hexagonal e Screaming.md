# Hexagonal Architecture + Screaming Architecture

## Arquitetura Hexagonal (Ports & Adapters)

O domínio fica no núcleo e não depende de nada externo. Frameworks, banco de dados e HTTP são detalhes de infraestrutura.

```
         ┌─────────────────────────────────────────┐
         │              Infrastructure              │
         │   (HTTP, TypeORM, RabbitMQ, etc.)        │
         │                                          │
         │   ┌───────────────────────────────────┐  │
         │   │          Application               │  │
         │   │   (Commands, Queries, Handlers)    │  │
         │   │                                   │  │
         │   │   ┌───────────────────────────┐   │  │
         │   │   │         Domain            │   │  │
         │   │   │  (Entities, Value Objects │   │  │
         │   │   │   Domain Events, Ports)   │   │  │
         │   │   └───────────────────────────┘   │  │
         │   └───────────────────────────────────┘  │
         └─────────────────────────────────────────┘
```

### Camadas

**Domain (núcleo)**
- Entidades de domínio (ex: `Empresa`, `Modelo`, `Processo`)
- Value Objects (ex: `CNPJ`, `CodigoModelo`)
- Domain Events (ex: `EmpresaCriada`)
- Ports (interfaces) — ex: `EmpresaRepository` (porta de saída)
- Sem dependência de nenhum framework

**Application**
- Casos de uso via CQRS (Commands e Queries)
- Orquestra o domínio
- Define ports de entrada (ex: `CriarEmpresaUseCase`)

**Infrastructure**
- Adapters que implementam os ports
- `EmpresaTypeormRepository` implementa `EmpresaRepository`
- Controllers HTTP (Fastify/NestJS)
- Publishers de eventos (RabbitMQ adapter)

---

## Screaming Architecture

A estrutura de pastas revela o domínio, não a tecnologia:

```
❌ Errado (grita a tecnologia):
src/
├── controllers/
├── services/
├── repositories/
└── models/

✅ Correto (grita o domínio):
src/
├── empresas/
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── modelos/
│   ├── domain/
│   ├── application/
│   └── infrastructure/
└── processos/
    ├── domain/
    ├── application/
    └── infrastructure/
```

---

## Exemplo de Código

### Port (interface no domínio)
```typescript
// empresas/domain/EmpresaRepository.port.ts
export interface EmpresaRepository {
  save(empresa: Empresa): Promise<void>;
  findById(id: string): Promise<Empresa | null>;
  findAll(): Promise<Empresa[]>;
  findByCnpj(cnpj: CNPJ): Promise<Empresa | null>;
}
```

### Adapter (implementação na infraestrutura)
```typescript
// empresas/infrastructure/EmpresaTypeormRepository.ts
@Injectable()
export class EmpresaTypeormRepository implements EmpresaRepository {
  constructor(
    @InjectRepository(EmpresaEntity)
    private readonly repo: Repository<EmpresaEntity>
  ) {}

  async save(empresa: Empresa): Promise<void> {
    await this.repo.save(EmpresaMapper.toPersistence(empresa));
  }
  // ...
}
```

### Entidade de Domínio
```typescript
// empresas/domain/Empresa.ts
export class Empresa {
  private readonly _id: string;
  private _nome: string;
  private _cnpj: CNPJ;
  private _events: DomainEvent[] = [];

  static criar(props: CriarEmpresaProps): Empresa {
    const empresa = new Empresa(props);
    empresa._events.push(new EmpresaCriada(empresa._id, empresa._cnpj));
    return empresa;
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events = [];
    return events;
  }
}
```

---

Ver [[CQRS e Event Sourcing]] para como Commands e Queries se encaixam nessa estrutura.
