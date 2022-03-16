FROM node:16 as build

RUN mkdir -p /usr/local/src/twaddle/api
WORKDIR /usr/local/src/twaddle/api

COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
RUN npm install

COPY .babelrc ./.babelrc
COPY src ./src
RUN npm run build

FROM node:16 as production

ENV PORT=3000
ENV NODE_ENV=production

RUN mkdir -p /usr/local/bin/twaddle/api
WORKDIR /usr/local/bin/twaddle/api

COPY --from=build /usr/local/src/twaddle/api/package.json ./package.json
COPY --from=build /usr/local/src/twaddle/api/package-lock.json ./package-lock.json
RUN npm install --production

COPY --from=build /usr/local/src/twaddle/api/dist ./dist

EXPOSE 3000
VOLUME [ "/usr/local/bin/twaddle/api/public" ]
VOLUME [ "/usr/local/bin/twaddle/api/resources" ]

CMD npm run start
