# i attempted to optimize this but if it causes issues just revert to a more basic dockerfile.
# currently we get a warning from server about how connect.session() i snot designed for a prod envioronment
# because it leaks memory and doesn't scale past a single process, so that will likely have to be changed. 
# but from my limited testing it works fine for now.

FROM node:18-alpine

ENV NODE_ENV=production

RUN apk add --no-cache tini

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "src/index.js"]
