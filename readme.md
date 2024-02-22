# Getting Started

## Clone the repository

```bash
git clone https://github.com/jackcrane/f1-api.git
```

## Install dependencies

```bash
cd f1-api
npm install
```

## Generate the databse

```bash
npx prisma migrate dev
```

## Ingress the data

This will take _hours_ to complete and will generate a huge database file.

```bash
cd ingress
node index.js
```
