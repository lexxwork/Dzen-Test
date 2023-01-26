export type ModelFindManyArgs<T> = {
  select?: T extends { select?: infer U } ? U : never;
  include?: T extends { include?: infer U } ? U : never;
  where?: T extends { where?: infer U } ? U : never;
  orderBy?: T extends { orderBy?: infer U } ? U : never;
  cursor?: T extends { cursor?: infer U } ? U : never;
  take: number;
};

export interface CursorKey {
  id: string | number;
  orderByItems?: [{ [key: string]: object | Date | number | string | boolean }];
}

export type CursorKeys = { prevCursor: CursorKey | null; nextCursor: CursorKey | null };

export type OrderBy = {
  [key: string]: object | 'asc' | 'desc';
};
