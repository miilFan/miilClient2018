FROM node:16-slim

WORKDIR /app

COPY . .

ENV PATH /app/node_modules/.bin:$PATH
RUN npm install

CMD [ "npm", "run", "start" ]
