export interface QueryOrder<T> {
  property: keyof T;
  ascending: boolean;
}
