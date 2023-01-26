import { Injectable } from '@nestjs/common';
import { Prisma, AttachmentType } from '@prisma/client';
import * as argon from 'argon2';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedAllService {
  constructor(private prisma: PrismaService) {}

  async run() {
    const userNames = [
      'Bob',
      'Alice',
      'Dave',
      'Charlie',
      'Eve',
      'Eve',
      'Eve',
      'Gary',
      'Jack',
      'Ivy',
    ];
    const emails = [
      'bob@example.com',
      'alice@example.com',
      'dave@example.com',
      'charlie@example.com',
      'frank@example.com',
      'helen@example.com',
      'eve@example.com',
      'gary@example.com',
      'jack@example.com',
      'ivy@example.com',
    ];

    const userGenerator = async (userName, email, password = 'password') => {
      const hash = await argon.hash(password);
      return {
        data: { email, userName, hash },
      };
    };

    const attachementGenerator = (
      userId,
      filename: string,
    ): Prisma.AttachmentCreateInput => {
      const types: AttachmentType[] = ['IMAGE', 'TEXT'];
      const typedExt = {
        [types[0]]: ['jpg', 'pgn', 'gif', 'png', 'jpeg'],
        [types[1]]: ['txt', 'md', 'html'],
      };
      const type = types[Math.floor(Math.random() * 2)];
      const ext = typedExt[type][Math.floor(Math.random() * typedExt[type].length)];
      return {
        fileUUID: randomUUID(),
        originalFileName: `${filename}.${ext}`,
        type,
        user: { connect: { id: userId } },
      };
    };

    const now = new Date();
    const messageGenerator = (text: string, authorId, extraVal?: string | number) => {
      const randomHours = Math.floor(Math.random() * 5);
      const createdAt = new Date(now.getTime());
      createdAt.setHours(createdAt.getHours() + randomHours);
      return {
        data: {
          homePage: `https://example${extraVal}.com`,
          text,
          createdAt,
          author: {
            connect: {
              id: authorId,
            },
          },
          attachment: {
            create: attachementGenerator(authorId, `filename${extraVal}`),
          },
          post: undefined,
          replyTo: undefined,
        },
        include: { author: true, attachment: true },
      };
    };

    const users = await Promise.all(
      [...Array(10).keys()].map(async (i) =>
        this.prisma.user.create(await userGenerator(userNames[i], emails[i])),
      ),
    );

    const posts = await Promise.all(
      [...Array(10).keys()].map((i) =>
        this.prisma.post.create(
          messageGenerator('This is a sample post N' + (i + 1), users[i].id, i),
        ),
      ),
    );

    const comments = await Promise.all(
      [...Array(10).keys()].map((i) => {
        const message = messageGenerator(
          'This is a sample comment N' + (i + 1),
          users[i].id,
          i,
        );
        message.data['post'] = { connect: { id: posts[i].id } };
        message.include['post'] = true;
        return this.prisma.comment.create(message);
      }),
    );

    const replies = await Promise.all(
      [...Array(10).keys()].map((i) => {
        const message = messageGenerator(
          'This is a sample reply N' + (i + 1),
          users[i].id,
          i,
        );
        message.data['post'] = { connect: { id: posts[i].id } };
        message.include['post'] = true;
        message.data['replyTo'] = { connect: { id: comments[i].id } };
        message.include['replyTo'] = true;
        return this.prisma.comment.create(message);
      }),
    );
    await Promise.all(
      [...Array(10).keys()].map((i) => {
        const message = messageGenerator(
          'This is a sample answer to reply N' + (i + 1),
          users[i].id,
          i,
        );
        message.data['post'] = { connect: { id: posts[i].id } };
        message.include['post'] = true;
        message.data['replyTo'] = { connect: { id: replies[i].id } };
        message.include['replyTo'] = true;
        return this.prisma.comment.create(message);
      }),
    );
  }
}
