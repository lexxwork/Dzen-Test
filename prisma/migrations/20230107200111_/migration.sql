-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL,
    `hash` VARCHAR(120) NOT NULL,
    `userName` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_id_userName_idx`(`id`, `userName`),
    INDEX `users_id_email_idx`(`id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `homePage` VARCHAR(400) NULL,
    `text` VARCHAR(5000) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `authorId` INTEGER NOT NULL,
    `attachmentId` INTEGER NULL,

    UNIQUE INDEX `posts_attachmentId_key`(`attachmentId`),
    INDEX `posts_id_createdAt_idx`(`id`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `homePage` VARCHAR(400) NULL,
    `text` VARCHAR(5000) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `authorId` INTEGER NOT NULL,
    `postId` INTEGER NOT NULL,
    `replyToId` INTEGER NULL,
    `attachmentId` INTEGER NULL,

    UNIQUE INDEX `comments_attachmentId_key`(`attachmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileUUID` CHAR(36) NOT NULL,
    `originalFileName` VARCHAR(300) NOT NULL,
    `type` ENUM('IMAGE', 'TEXT') NOT NULL,
    `userId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_replyToId_fkey` FOREIGN KEY (`replyToId`) REFERENCES `comments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `attachments` ADD CONSTRAINT `attachments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
