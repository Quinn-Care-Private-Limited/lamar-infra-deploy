#!/bin/bash

export DATABASE_URL=$1 && npm run db:migrate