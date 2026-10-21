# Aethereal Data

Free crypto, blockchain, and market datasets at **dataset.aethereal.top**: CSV and Parquet downloads, column docs, previews, and Python snippets.

## How it works

- `shared/datasets.ts`: the dataset registry (title, description, source, license, columns).
- `server/utils/collectors.ts`: one collector per dataset that fetches rows from its source.
- `server/utils/store.ts`: writes `<slug>.json` (rows), `.csv`, `.parquet`, `.meta.json` to `DATA_DIR`.
- A Nitro scheduled task (`datasets:refresh`) rebuilds everything daily at 01:15 UTC; missing datasets are built on boot.
- `append` datasets (e.g. on-chain stablecoin supply) keep history: each run adds the day's rows.

## Add a dataset

1. Add an entry to `DATASETS` in `shared/datasets.ts`.
2. Add a collector with the same slug in `server/utils/collectors.ts` returning rows with exactly those columns.
3. Check the source's license allows redistribution, and state it in `license`.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000; datasets build ~5 s after start
npm test
```

Force a rebuild in dev: open `http://localhost:3000/_nitro/tasks/datasets:refresh`.

## Deploy (Dokploy)

- Build type: Dockerfile. Port 3000.
- Mount a volume at `/app/.data` (keeps dataset history across deploys).
- Domain: `dataset.aethereal.top`.

## MCP

`POST /mcp` is a read-only remote MCP server (Streamable HTTP, stateless JSON) with `list_datasets`, `describe_dataset`, `query_dataset`, and `aggregate_dataset`. Query logic lives in `shared/query.ts`.

```bash
claude mcp add --transport http aethereal-data https://dataset.aethereal.top/mcp
```
