# Aethereal Data

Dataset hub (Kaggle-style, datasets only) for crypto, blockchain, and stocks at data.aethereal.top. Nuxt 4 + Tailwind 4, deployed with Dokploy (Dockerfile). Sister site of aethereal.top; keep the same visual style (Plus Jakarta Sans, white, chrome-text gradient).

## Conventions
- Registry in `shared/datasets.ts` is the single source of truth; collectors in `server/utils/collectors.ts` must return exactly the registry's columns (refresh rejects unknown columns).
- Stock exchange price data (Yahoo, IDX) must not be redistributed as files; the /stocks page shows code to fetch it instead.
- Every dataset states its source and license. DefiLlama-based datasets always credit DefiLlama with a link (their ToS restricts republishing; owners accepted that risk).
- On-chain data is read via public RPC (publicnode). Read decimals()/symbol() from contracts; never hardcode decimals.
- Data lives in DATA_DIR (default .data/datasets, /app/.data/datasets in Docker on a mounted volume).

## Not done yet
- Notebooks, competitions, accounts: out of scope for v1.
