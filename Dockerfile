# pull official base image
FROM node:13.12.0-alpine as build-stage

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
COPY . .
RUN npm install --silent
RUN npm run build
RUN npm install react-scripts@3.4.1 -g --silent

ARG SERVER_URL

RUN echo "REACT_APP_SERVER_URL='${SERVER_URL}'" > .env
RUN cat .env

RUN npm run build

# add app

#####################
FROM nginx:stable-alpine
COPY --from=build-stage /app/build/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]