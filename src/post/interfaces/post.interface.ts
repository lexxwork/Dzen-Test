import { Prisma } from '@prisma/client';

export type PostOrderBy = 'userName' | 'email' | 'createdAt';

export type PostOrderType = 'asc' | 'desc';

export type PostItem = Prisma.PostGetPayload<
  Prisma.PostFindManyArgs & { select: { comments: Prisma.CommentFindManyArgs[] } }
>;

export type PostsResponse = {
  posts: PostItem[];
  cursor?: string | null;
};
