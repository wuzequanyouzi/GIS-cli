# projectAddress 镜像地址 【eg】:192.168.133.23:9001/library/nginx:1.14
# alias 镜像别名

FROM projectAddress as alias

RUN mkdir /home/web

COPY . /home/web

# 执行依赖下载，打包
RUN npm install -g cnpm --registry=https://registry.npm.taobao.org\
  && cd /home/web/page\
  && cnpm install\
  && chmod -R 755 node_modules/.bin\
  && npm run build

# 拉取nginx镜像
FROM nginx projectAddress
# 从一镜像中将文件复制至另一镜像文件
COPY --from=alias /home/web/page/dist/. /usr/share/nginx/html/
# 写入nginx配置文件模板
COPY ./nginx.template /etc/nginx/conf.d/default.template

# 添加shell脚本
ADD docker-run.sh /home/

# 给予脚本权限
RUN chmod +x /home/docker-run.sh

# 执行脚本：使用环境变量替换nginx配置文件模板字符串
ENTRYPOINT ["/home/docker-run.sh"]

