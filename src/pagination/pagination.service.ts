import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import cloneDeep from 'lodash/cloneDeep';

export type SortInfo = {
  fieldName: string;
  reference: string;
  type: 'asc' | 'desc';
};

export type ModelFindManyArgs<T> = {
  select?: T extends { select: any } ? T['select'] : null;
  include?: T extends { include: any } ? T['include'] : null;
  where?: T extends { where: any } ? T['where'] : null;
  orderBy?: T extends { orderBy: any } ? T['orderBy'] : null;
  cursor?: T extends { cursor: any } ? T['cursor'] : null;
  take?: T extends { take: any } ? T['take'] : null;
  // skip?: T extends { skip: any } ? T['skip'] : null;
  // distinct?: T extends { distinct: any } ? T['distinct'] : null;
};

export interface NextKey {
  id: any;
  sortedValue?: any;
}

@Injectable()
export class Pagination {
  constructor(private prisma: PrismaService, private logger: Logger) {}

  private nextKeyFn(
    lastId: string | number | undefined,
    lastValue: any | undefined,
  ): NextKey | null {
    if (!lastId) {
      return null;
    }
    if (!lastValue) {
      return { id: lastId };
    }
    return { id: lastId, sortedValue: lastValue };
  }

  async findManyPaginate(props: {
    modelName: Prisma.ModelName;
    where: unknown;
    include?: object;
    take;
    select?: object;

    sortInfo?: SortInfo;
    nextKey?: NextKey;
  }) {
    const {
      modelName: modelName,
      where,
      include,
      take,
      select,
      sortInfo,
      nextKey,
    } = props;
    let paginatedWhere = undefined;
    let orderBy = undefined;

    if (sortInfo && typeof sortInfo === 'object') {
      const { fieldName, reference, type } = sortInfo;
      orderBy = { [fieldName]: type };
      if (reference) {
        orderBy = { [reference]: orderBy };
      }
    }

    if (where && typeof where === 'object') {
      paginatedWhere = cloneDeep(where) as any;
    }

    if (nextKey) {
      paginatedWhere = paginatedWhere ? paginatedWhere : {};
      if (!sortInfo || !nextKey.sortedValue) {
        paginatedWhere.id = { gt: nextKey.id };
      } else {
        const { id, sortedValue } = nextKey;
        const { fieldName, reference, type } = sortInfo;
        const sortType = type === 'asc' ? 'gt' : 'lt';
        let lastSortedItem = { [fieldName]: sortedValue };
        let sortObject = { [fieldName]: { [sortType]: sortedValue } };

        if (reference) {
          lastSortedItem = { [reference]: lastSortedItem };
          sortObject = { [reference]: sortObject };
        }
        const paginationQuery = [
          sortObject,
          { AND: [lastSortedItem, { id: { [sortType]: id } }] },
        ];

        if (paginatedWhere.OR == null) {
          paginatedWhere.OR = paginationQuery;
        } else {
          paginatedWhere = { AND: [where, { OR: paginationQuery }] };
        }
      }
    }

    const fullQuery = {
      where: paginatedWhere,
      include,
      take,
      select,
      orderBy,
    };

    this.logger.log(JSON.stringify({ fullQuery }));
    console.log(JSON.stringify({ fullQuery }, null, 2));

    const items = await this.prisma[modelName].findMany(fullQuery);
    if (!items || !items.length) {
      return { items: null, nextKey, sortInfo };
    }
    const lastItem = items[items.length - 1];
    const lastId = lastItem.id;
    const { fieldName, reference } = sortInfo;
    const lastValue = reference ? lastItem[reference][fieldName] : lastItem[fieldName];
    const newNextKey = await this.nextKeyFn(lastId, lastValue);
    return { items, nextKey: newNextKey, sortInfo };
  }
}
