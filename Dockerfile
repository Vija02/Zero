FROM alpine:3 AS downloader

ARG TARGETOS
ARG TARGETARCH
ARG TARGETVARIANT
ARG VERSION=0.34.0

ENV BUILDX_ARCH="${TARGETOS:-linux}_${TARGETARCH:-amd64}${TARGETVARIANT}"

RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/pocketbase_${VERSION}_${BUILDX_ARCH}.zip \
    && unzip pocketbase_${VERSION}_${BUILDX_ARCH}.zip \
    && chmod +x /pocketbase

# Build frontends
FROM oven/bun AS frontend_builder
WORKDIR /app/

COPY ./frontend /app
RUN bun install --frozen-lockfile
RUN bun run build

# Build final image
FROM alpine:3
RUN apk update && apk add ca-certificates tzdata && rm -rf /var/cache/apk/*

COPY --from=downloader /pocketbase /usr/local/bin/pocketbase
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY ./pb_migrations /pb_migrations
COPY ./pb_hooks /pb_hooks
COPY --from=frontend_builder /app/dist /pb_public

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
