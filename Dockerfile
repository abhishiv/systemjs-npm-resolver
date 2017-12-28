FROM mhart/alpine-node:9.3

WORKDIR /src
ADD . .

RUN npm install

EXPOSE 80
ENTRYPOINT ["npm", "run", "start"]