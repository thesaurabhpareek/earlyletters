# ADR 0010: Web app — `apps/web` Next.js on Vercel inside the monorepo, sharing pure-TS packages

Status: Accepted. Date: 2026-10-01.

## Context
Later: landing page, waitlist, browser book reader (read-only first), print checkout.

## Decision
- `apps/web`: Next.js (App Router, TS) deployed to Vercel; in the existing npm workspaces.
- Shared packages (pure TS, no React Native imports): `packages/core` (clean, verifier, alignment projection, safety tiers), `packages/ai` (interfaces + OpenAI-compatible provider for Edge/Node), `packages/analytics` (event types), `packages/brand` (tokens), new `packages/book` (book model: month-of-age grouping, approval filter, HTML/CSS template used for on-device PDF and web reader), `packages/db-types` (generated Supabase types).
- Web reads Supabase directly (supabase-js, RLS) — no PowerSync on web in v1. Audio playback on web requires decrypting with the CCK: in Standard mode via an Edge Function that unwraps with escrow and returns a short-lived decrypted stream; Vault mode audio is phone-only until web key import exists.
- Waitlist: a Postgres table with an insert-only RLS policy and a rate-limited Edge Function.
- Vercel plan: Pro if commercial (Hobby terms Unverified).

## Consequences
One book template for PDF and web. No UI library decided here (designers own that).

## Alternatives rejected
Expo web (react-native-web) for marketing pages (SEO and design freedom weaker); separate repo (loses shared engine).
