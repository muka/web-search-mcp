FROM ubuntu:24.04

RUN apt update -q && apt install -y nodejs npm

WORKDIR /app
ADD package.json .
RUN npm i
ADD ./ .
RUN npm run build

WORKDIR /app

ENTRYPOINT [ "node" ]
CMD [ "build/src/main.js" ]