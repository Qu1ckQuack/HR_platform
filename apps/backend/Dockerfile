FROM node:22-bookworm-slim

WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node apps/backend/package.json apps/backend/package.json
COPY --chown=node:node apps/frontend/package.json apps/frontend/package.json
COPY --chown=node:node packages/shared/package.json packages/shared/package.json

RUN chown node:node /app
USER node
RUN npm ci --omit=dev --workspace=@hr-platform/backend --include-workspace-root=false

COPY --chown=node:node apps/backend/src apps/backend/src
COPY --chown=node:node packages/shared/src packages/shared/src

ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app/apps/backend

EXPOSE 4000
CMD ["npm", "--prefix", "/app", "run", "start", "--workspace=@hr-platform/backend"]
