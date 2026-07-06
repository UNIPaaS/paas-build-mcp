# paas.build MCP server — stdio, zero-dependency Node
FROM node:22-alpine
WORKDIR /app
COPY paas-build-mcp.mjs package.json ./
ENV PAAS_PROXY=https://api.paas.build
CMD ["node", "paas-build-mcp.mjs"]
