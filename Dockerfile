FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Turkvet yuklemeleri icin klasor (uploads/ .gitignore'da, imaj icinde olusturulmali)
RUN mkdir -p uploads/turkvet

EXPOSE 4342

CMD ["node", "app.js"]
