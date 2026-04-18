export interface IRepository<T, CreateDTO, UpdateDTO = Partial<CreateDTO>> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  create(dto: CreateDTO): Promise<T>;
  update(id: string, dto: UpdateDTO): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
