# Grip

Monorepo for Grip — a local-first marketplace + social + on-demand "super app" inspired by Grindr/Facebook Marketplace/Airbnb/Uber.

- Mobile client: React Native (Expo)
- Backend: Holochain (Rust)
- Repo: Yarn/PNPM workspaces under `packages/`

## Structure

```
packages/
  backend/    # Holochain hApp skeleton (Rust workspace + DNA placeholders)
  mobile/     # React Native app (Expo) or placeholder until scaffolded
.github/
  workflows/  # CI
```

## Getting Started

Prerequisites:
- Node.js 18+
- Yarn or PNPM (recommended) or npm
- Rust toolchain (stable) + Holochain dev prerequisites
- GitHub CLI (`gh`) for repo creation

### Install

```
# at repo root
yarn install  # or pnpm install
```

### Mobile (Expo)

```
cd packages/mobile
yarn start
```

### Backend (Holochain)

This repository includes a Rust crate skeleton and DNA placeholders. See `packages/backend/README.md` for setup steps and links to Holochain docs.

## License

Apache-2.0


