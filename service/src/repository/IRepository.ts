export interface IRepository<T> {
    create(entity: T): Promise<T>;
    findById(id: string): Promise<T | null>;
    findAll(): Promise<T[]>;
    update(id: string, entity: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<void>;
}