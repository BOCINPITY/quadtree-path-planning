--- 登录日志表
CREATE TABLE `LoginLogs` (
    `id` int NOT NULL AUTO_INCREMENT, -- 日志ID
    `userId` int NOT NULL, -- 用户ID，关联到Users表
    `loginTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 登录时间
    `ipAddress` varchar(255) NOT NULL, -- 登录IP地址
    `userAgent` varchar(255) DEFAULT NULL, -- 用户代理信息
    PRIMARY KEY (`id`),
    KEY `userId` (`userId`),
    CONSTRAINT `loginlogs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 12 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci

-- 用户表
CREATE TABLE `Users` (
    `id` int NOT NULL AUTO_INCREMENT, -- 用户ID
    `name` varchar(255) NOT NULL, -- 用户名
    `email` varchar(255) NOT NULL, -- 用户邮箱
    `password` varchar(255) NOT NULL, -- 用户密码
    `createdAt` datetime NOT NULL, -- 创建时间
    `updatedAt` datetime NOT NULL, -- 更新时间
    `avatar` varchar(255) DEFAULT 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png', -- 用户头像URL
    `bio` text, -- 用户简介
    `address` varchar(255) DEFAULT NULL, -- 用户地址
    `field` varchar(255) DEFAULT NULL, -- 用户领域
    `birthday` date DEFAULT NULL, -- 用户生日
    `gender` enum('male', 'female', 'other') DEFAULT NULL, -- 用户性别
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci

--障碍物表
CREATE TABLE `Obstacles` (
    `id` varchar(255) NOT NULL, -- 障碍物ID
    `mapId` int NOT NULL, -- 地图ID，关联到Maps表
    `type` varchar(50) NOT NULL, -- 障碍物类型
    `x` int NOT NULL, -- 障碍物X坐标
    `y` int NOT NULL, -- 障碍物Y坐标
    `fill` varchar(50) NOT NULL DEFAULT '#000', -- 填充颜色
    `stroke` varchar(50) NOT NULL DEFAULT '#000', -- 边框颜色
    `strokeWidth` int NOT NULL DEFAULT '0', -- 边框宽度
    `radius` int DEFAULT NULL, -- 半径（适用于圆形障碍物）
    `width` int DEFAULT NULL, -- 宽度（适用于矩形障碍物）
    `height` int DEFAULT NULL, -- 高度（适用于矩形障碍物）
    `createdAt` datetime NOT NULL, -- 创建时间
    `updatedAt` datetime NOT NULL, -- 更新时间
    PRIMARY KEY (`id`),
    KEY `mapId` (`mapId`),
    CONSTRAINT `obstacles_ibfk_1` FOREIGN KEY (`mapId`) REFERENCES `Maps` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci

-- 地图表
CREATE TABLE `Maps` (
    `id` int NOT NULL AUTO_INCREMENT, -- 地图ID
    `name` varchar(255) NOT NULL, -- 地图名称
    `description` varchar(255) NOT NULL DEFAULT '无描述', -- 地图描述
    `dividColor` varchar(255) NOT NULL DEFAULT '#0077ff', -- 分割线颜色
    `minThreshold` int NOT NULL DEFAULT '20', -- 最小阈值
    `width` int NOT NULL, -- 地图宽度
    `height` int NOT NULL, -- 地图高度
    `startPoint` json DEFAULT NULL, -- 起点
    `endPoint` json DEFAULT NULL, -- 终点
    `userId` int NOT NULL, -- 用户ID，关联到Users表
    `createdAt` datetime NOT NULL, -- 创建时间
    `updatedAt` datetime NOT NULL, -- 更新时间
    PRIMARY KEY (`id`),
    KEY `userId` (`userId`),
    CONSTRAINT `maps_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 9 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci