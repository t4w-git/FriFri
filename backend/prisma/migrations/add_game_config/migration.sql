-- CreateTable GameConfig
CREATE TABLE `GameConfig` (
    `id` VARCHAR(191) NOT NULL,
    `gameType` VARCHAR(50) NOT NULL,
    `attemptsPerDay` INTEGER NOT NULL DEFAULT 10,
    `cooldownMinutes` INTEGER NOT NULL DEFAULT 5,
    `dailyResetHour` INTEGER NOT NULL DEFAULT 0,
    `description` LONGTEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GameConfig_gameType_key`(`gameType`),
    INDEX `GameConfig_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
