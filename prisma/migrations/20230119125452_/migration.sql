-- DropIndex
DROP INDEX `posts_id_createdAt_idx` ON `posts`;

-- DropIndex
DROP INDEX `users_id_email_idx` ON `users`;

-- DropIndex
DROP INDEX `users_id_userName_idx` ON `users`;

-- CreateIndex
CREATE INDEX `posts_id_idx` ON `posts`(`id` DESC);

-- CreateIndex
CREATE INDEX `posts_createdAt_idx` ON `posts`(`createdAt` DESC);

-- CreateIndex
CREATE INDEX `users_id_idx` ON `users`(`id`);

-- CreateIndex
CREATE INDEX `users_userName_idx` ON `users`(`userName`(10) ASC);

-- CreateIndex
CREATE INDEX `users_email_idx` ON `users`(`email`(10) ASC);
