FROM python:3.13-slim

WORKDIR /app

# Install uv from official binary
COPY --from=ghcr.io/astral-sh/uv:0.13.7 /uv /uvx /bin/

# Copy project definition and workspace
COPY pyproject.toml uv.lock README.md ./
COPY foundations ./foundations
COPY infrastructure ./infrastructure
COPY src ./src
COPY public ./public

# Sync all workspace dependencies
RUN uv sync --frozen --no-cache

EXPOSE 8000

CMD ["uv", "run", "bytebank"]
