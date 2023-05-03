import { Prisma } from '@prisma/client';

export type CommentOrderBy = 'userName' | 'email' | 'createdAt';

export type CommentOrderType = 'asc' | 'desc';

export type CommentItem = Prisma.CommentGetPayload<
  Prisma.CommentFindManyArgs & { select: { comments: Prisma.CommentFindManyArgs[] } }
>;

export type CommentsResponse = {
  comments: CommentItem[];
  cursor?: string | null;
};
