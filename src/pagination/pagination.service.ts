import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { set, cloneDeep, orderBy as _orderBy, unzip } from 'lodash';
import {
  createPathsFromObject,
  extractValueByPath,
  extractObjectByPath,
} from 'utils/objects';
import { OrderBy, NextKey, ModelFindManyArgs } from './interfaces/pagination.interface';

const ORDERBYMAP = { asc: 'gt', desc: 'lt' };

const orderByExtend = (
  orderByArr: OrderBy[] | NextKey['orderByItems'],
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
      const pathHash = path.map((item) => item.replace(/\./g, '\\.')).join('.');
      return [pathHash, { item, path }];
    }),
  );
};

const orderByToQuery = (orderByArr: OrderBy[], nextKey: NextKey) => {
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
    const orderByKey = ORDERBYMAP[orderType];
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

const nextKeyFn = (
  lastItem: any | undefined,
  orderBy: OrderBy | OrderBy[],
): NextKey | null => {
  if (!lastItem) {
    return null;
  }
  const nextKey: NextKey = { id: lastItem.id };
  let orderByArr = orderBy ? cloneDeep(orderBy) : [];
  orderByArr = (Array.isArray(orderByArr) ? orderByArr : [orderByArr]) as OrderBy[];
  if (!lastItem || !orderByArr.length) {
    return nextKey;
  }
  const orderByKeys: any[] = [];
  for (const orderBy of orderByArr) {
    const path = createPathsFromObject(orderBy)[0];
    if (path.includes('id')) {
      continue;
    }
    const whereItem = extractObjectByPath(lastItem, path);
    if (whereItem) {
      orderByKeys.push(whereItem);
      break;
    }
  }
  if (orderByKeys.length > 0) {
    nextKey.orderByItems = orderByKeys as NextKey['orderByItems'];
  }
  return nextKey;
};

@Injectable()
export class PaginationService {
  constructor(private prisma: PrismaService) {}

  async findManyPaginate<T>(
    modelName: Prisma.ModelName,
    findManyArgs: ModelFindManyArgs<T> = { take: 25 },
    nextKey: NextKey = undefined,
  ): Promise<{
    items: Array<any>;
    nextKey: NextKey;
  }> {
    const { where, include, take, select, orderBy } = findManyArgs;
    let paginatedWhere = undefined;
    let orderByArr = orderBy ? cloneDeep(orderBy) : [];
    orderByArr = (Array.isArray(orderByArr) ? orderByArr : [orderByArr]) as OrderBy[];

    if (where && typeof where === 'object') {
      paginatedWhere = cloneDeep(where) as any;
    }

    const idIndex = orderByArr.findIndex((item) => 'id' in item);
    const orderByHasId = idIndex >= 0;

    if (nextKey) {
      paginatedWhere = paginatedWhere ? paginatedWhere : {};
      if (orderByArr.length === 1 && orderByHasId) {
        const orderBy = ORDERBYMAP[orderByArr[0].id];
        paginatedWhere.id = { [orderBy]: nextKey.id };
      } else if (
        !orderByArr.length ||
        !nextKey.orderByItems ||
        !nextKey.orderByItems.length
      ) {
        paginatedWhere.id = { gt: nextKey.id };
      } else {
        const paginationQuery = orderByToQuery(orderByArr as OrderBy[], nextKey);
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
      return { items: null, nextKey: null };
    }
    const lastItem = items[items.length - 1];
    const newNextKey = await nextKeyFn(lastItem, orderBy as OrderBy[]);
    items =
      postSortingArgs && postSortingArgs.length
        ? _orderBy(items, ...postSortingArgs)
        : items;

    console.log(
      JSON.stringify({ prismaQuery, postSortingArgs, items, newNextKey }, null, 2),
    );

    return { items, nextKey: newNextKey };
  }
}
