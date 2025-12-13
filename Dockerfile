FROM alpine:3 AS downloader

ARG TARGETOS
ARG TARGETARCH
ARG TARGETVARIANT
ARG VERSION=0.34.0

ENV BUILDX_ARCH="${TARGETOS:-linux}_${TARGETARCH:-amd64}${TARGETVARIANT}"

RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/pocketbase_${VERSION}_${BUILDX_ARCH}.zip \
    && unzip pocketbase_${VERSION}_${BUILDX_ARCH}.zip \
    && chmod +x /pocketbase

# Litestream
ARG LITESTREAM_VERSION=0.5.3
RUN wget -qO /tmp/litestream.tar.gz "https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-${LITESTREAM_VERSION}-${TARGETOS}-$([ "$(uname -m)" == "x86_64" ] && echo "x86_64" || echo "${TARGETARCH}").tar.gz" \
    && tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz \
    && chmod +x /usr/local/bin/litestream

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
COPY --from=downloader /usr/local/bin/litestream /usr/local/bin/litestream
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
COPY etc/litestream.yml /etc/litestream.yml

COPY ./pb_migrations /pb_migrations
COPY ./pb_hooks /pb_hooks
COPY --from=frontend_builder /app/dist /pb_public

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
