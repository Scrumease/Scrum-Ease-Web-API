export interface FindPaginated<T>{
    total: number;
    page: number;
    limit: number;
    data: T[];
}