#!/bin/bash
rm -rf primsa/migrations
export DATABASE_URL=$1 && npm run db:migrate