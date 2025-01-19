FROM node:20 as builder

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./

COPY . .

# Install app dependencies
RUN npm install
RUN npm run build

FROM node:20 as runner 

WORKDIR /app 

COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

CMD [ "npm", "run", "start" ]

# FROM node:20-buster
# # RUN apt-get update && \
# #   apt-get install -y openssl

# # Create app directory
# WORKDIR /app

# COPY package.json ./
# COPY yarn.lock ./
# COPY tsconfig.json ./
# COPY ./prisma ./prisma

# # Install app dependencies
# RUN yarn
# RUN yarn build

# COPY . .

# CMD [ "yarn", "start:migrate:prod" ]