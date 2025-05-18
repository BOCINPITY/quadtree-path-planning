# 使用 Node.js 20 版本作为基础镜像
FROM node:20

# 设置工作目录
WORKDIR /app

# 复制项目文件到容器中
COPY . .

# 安装依赖
RUN npm install

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["npm", "start"]