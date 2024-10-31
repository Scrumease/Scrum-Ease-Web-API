FROM node:22-alpine AS build
ARG PORT
ARG NODE_ENV
ARG MONGO_URI
ARG MAIL_HOST
ARG MAIL_PORT
ARG SMTP_USERNAME
ARG SMTP_PASSWORD
ARG FRONTEND_URL

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

EXPOSE 8080

ENV PORT=$PORT
ENV NODE_ENV=$NODE_ENV
ENV MONGO_URI=$MONGO_URI
ENV MAIL_HOST=$MAIL_HOST
ENV MAIL_PORT=$MAIL_PORT
ENV SMTP_USERNAME=$SMTP_USERNAME
ENV SMTP_PASSWORD=$SMTP_PASSWORD
ENV FRONTEND_URL=$FRONTEND_URL

CMD ["npm", "start"]
