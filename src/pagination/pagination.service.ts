import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { set, cloneDeep, orderBy as _orderBy, unzip } from 'lodash';
import {
  createPathsFromObject,
  extractValueByPath,
  extractObjectByPath,
} from 'utils/objects';
import {
  OrderBy,
  CursorKey,
  ModelFindManyArgs,
  CursorKeys,
} from './interfaces/pagination.interface';

const ORDERBYMAP = { asc: 'gt', desc: 'lt' };
const ORDERRVERSE = { gt: 'lt', lt: 'gt' };

const orderByExtend = (
  orderByArr: OrderBy[] | CursorKey['orderByItems'],
): {
  [pathHash: string]: {
    item: any;
    path: string[];
  };
} => {
  if (!orderByArr || !orderByArr.length) return null;
  return Object.fromEntries(
    orderByArr.map((item) => {
      const path = createPathsFromObject(item)[0];
      const pathHash = Array.isArray(path)
        ? path.map((item) => item.replace(/\./g, '\\.')).join('.')
        : path;
      return [pathHash, { item, path }];
    }),
  );
};

const orderByToQuery = (orderByArr: OrderBy[], nextKey: CursorKey, reverse = false) => {
  const whereUnique: any[] = [];
  const whereDuplicates: any[] = [];
  const { id, orderByItems } = nextKey;
  const orderByItemsInfo = orderByExtend(orderByItems);
  const orderByArrInfo = orderByExtend(orderByArr);
  for (const [pathHash, { item: orderBy, path: orderByPath }] of Object.entries(
    orderByArrInfo,
  )) {
    if (pathHash === 'id') {
      continue;
    }
    if (!(pathHash in orderByItemsInfo)) {
      continue;
    }
    const itemQuery = orderByItemsInfo[pathHash].item;
    const orderType = extractValueByPath(orderBy, orderByPath);
    const itemValue = extractValueByPath(itemQuery, orderByPath);
    let orderByKey = ORDERBYMAP[orderType];
    orderByKey = !reverse ? orderByKey : ORDERRVERSE[orderByKey];
    const orderByValueQuery = set(cloneDeep(itemQuery), orderByPath, {
      [orderByKey]: itemValue,
    });
    const orderByIdQuery = { id: { [orderByKey]: id } };
    whereUnique.push(orderByValueQuery);
    whereDuplicates.push({ AND: [itemQuery, orderByIdQuery] });
  }
  return [
    whereUnique.length === 1 ? whereUnique[0] : { AND: whereUnique },
    whereDuplicates.length === 1 ? whereDuplicates[0] : { OR: whereDuplicates },
  ];
};

export const cursorKeyFn = (
  items: any[] | undefined,
  orderBy: OrderBy | OrderBy[],
): CursorKeys => {
  if (!items || !items.length) {
    return { nextCursor: null, prevCursor: null };
  }
  const firstItem = items[0];
  const lastItem = items[items.length - 1];

  const prevCursor: CursorKey = { id: firstItem.id };
  const nextCursor: CursorKey = { id: lastItem.id };
  let orderByArr = orderBy ? cloneDeep(orderBy) : [];
  orderByArr = (Array.isArray(orderByArr) ? orderByArr : [orderByArr]) as OrderBy[];
  if (!orderByArr.length) {
    return { nextCursor, prevCursor };
  }
  const orderByValPrev: any[] = [];
  const orderByValNext: any[] = [];
  for (const orderBy of orderByArr) {
    const path = createPathsFromObject(orderBy)[0];
    if (path.includes('id')) {
      continue;
    }
    const oPrev = extractObjectByPath(firstItem, path);
    if (oPrev && !orderByValPrev.length) {
      orderByValPrev.push(oPrev);
    }
    const oNext = extractObjectByPath(lastItem, path);
    if (oNext && !orderByValNext.length) {
      orderByValNext.push(oNext);
    }
  }
  if (orderByValPrev.length > 0) {
    prevCursor.orderByItems = orderByValPrev as CursorKey['orderByItems'];
  }
  if (orderByValNext.length > 0) {
    nextCursor.orderByItems = orderByValNext as CursorKey['orderByItems'];
  }
  return { prevCursor, nextCursor };
};

@Injectable()
export class PaginationService {
  constructor(private prisma: PrismaService) {}

  async findManyPaginate<T>(
    modelName: Prisma.ModelName,
    findManyArgs: ModelFindManyArgs<T> = { take: 25 },
    cursorkeys: CursorKeys = { prevCursor: null, nextCursor: null },
  ): Promise<{
    items: Array<any>;
    cursorKeys: CursorKeys;
  }> {
    const { where, include, take, select, orderBy } = findManyArgs;
    const { prevCursor, nextCursor } = cursorkeys;
    let paginatedWhere = undefined;
    const reverse = take < 0;
    let orderByArr = orderBy ? cloneDeep(orderBy) : [];
    orderByArr = (Array.isArray(orderByArr) ? orderByArr : [orderByArr]) as OrderBy[];

    if (where && typeof where === 'object') {
      paginatedWhere = cloneDeep(where) as any;
    }

    const idIndex = orderByArr.findIndex((item) => 'id' in item);
    const orderByHasId = idIndex >= 0;

    const cursorKey = !reverse ? nextCursor : prevCursor;
    if (cursorKey) {
      paginatedWhere = paginatedWhere ? paginatedWhere : {};
      if (orderByArr.length === 1 && orderByHasId) {
        let orderBy = ORDERBYMAP[orderByArr[0].id];
        orderBy = !reverse ? orderBy : ORDERRVERSE[orderBy];
        paginatedWhere.id = { [orderBy]: cursorKey.id };
      } else if (
        !orderByArr.length ||
        !cursorKey.orderByItems ||
        !cursorKey.orderByItems.length
      ) {
        paginatedWhere.id = { gt: cursorKey.id };
      } else {
        const paginationQuery = orderByToQuery(
          orderByArr as OrderBy[],
          cursorKey,
          reverse,
        );
        if (paginatedWhere.OR == null) {
          paginatedWhere.OR = paginationQuery;
        } else {
          paginatedWhere = { AND: [where, { OR: paginationQuery }] };
        }
      }
    }
    let postSortingArgs: string[][];
    if (orderByArr.length > 1) {
      postSortingArgs = unzip(
        orderByArr.map((item) => {
          const path = createPathsFromObject(item)[0];
          const type = extractValueByPath(item, path);
          return [path.join('.'), type];
        }),
      );
      const orderByHead = [];
      if (orderByHasId) {
        orderByHead.push(orderByArr.find((_, i) => i !== idIndex));
        orderByHead.push(orderByArr[idIndex]);
      } else {
        orderByHead.push(orderByArr[0]);
      }
      orderByArr = orderByHead;
    }
    if (orderByArr.length && !orderByHasId) {
      const firstOrderBy = Array.isArray(orderBy) ? orderBy[0] : orderBy;
      const path = createPathsFromObject(orderByArr[0])[0];
      const orderType = extractValueByPath(firstOrderBy, path);
      orderByArr.push({ id: orderType });
    }

    const prismaQuery = {
      where: paginatedWhere,
      include,
      take,
      select,
      orderBy: orderByArr,
    };

    let items = await this.prisma[modelName].findMany(prismaQuery);
    if (!items || !items.length) {
      const cursorKeys = {
        nextCursor: reverse ? prevCursor : null,
        prevCursor: reverse ? null : nextCursor,
      };
      return { items: null, cursorKeys };
    }
    const cursorKeys = cursorKeyFn(items, orderBy as OrderBy[]);
    items =
      postSortingArgs && postSortingArgs.length
        ? _orderBy(items, ...postSortingArgs)
        : items;

    // console.log(
    // JSON.stringify({ prismaQuery, postSortingArgs, items, cursorKeys }, null, 2),
    // );

    return { items, cursorKeys };
  }
}
