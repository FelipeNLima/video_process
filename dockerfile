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