# Sources of the locked-pack PDF

The PDF "Early Letters - Product vision, requirements and delivery plan (locked v1.0, 20 Nov 2026)" in the founder's Drive is built from two inputs:

1. The repository at the lock branch `docs/prd-lock-v1-20nov`, head `450bcb4a`: the cards `docs/product/prd/00` to `16`, the backlog rows BL-922 to BL-987 and the stack rank. Parts III and the appendices are those files, unchanged.
2. The files in this folder, which exist only for the PDF: `01-strategy.md` (Part I: mission, vision, what we have today, customers, industry and market, benchmarking, positioning), `02-product.md` (Part II), `03-measure.md` (Part IV: NFRs, outcomes and KPIs, cost), `04-delivery.md` (Part V: dependency map, buckets, project plan, task list), `sources.md`, `research-notes.md` (what was read for Part I, with dates), `deps.dot` (the dependency map) and `build.py` with `style.css` (the build: pandoc then headless Chrome).

Precedence (CR-66): where anything here differs from a card, the card wins.
