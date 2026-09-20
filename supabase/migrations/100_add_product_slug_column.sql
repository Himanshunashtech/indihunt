-- ============================================================================
-- Migration 100: Add slug generated column + index to products
-- Eliminates the 3-fallback full-table scan (limit 500) in getProductByIdRaw
-- by enabling a single indexed eq('slug', normalizedKey) lookup.
--
-- The slug formula mirrors getProductSlug() in src/lib/supabase.ts:
--   lowercase → trim → strip apostrophes → &amp; → "and" → strip other HTML entities
--   → strip non-word chars → collapse whitespace/hyphens/underscores → trim hyphens
-- ============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug text GENERATED ALWAYS AS (
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  -- strip apostrophes / curly quotes
                  regexp_replace(
                    trim(lower(name)),
                    E'[''\u2019\u2018]', '', 'g'
                  ),
                  -- &amp; -> and
                  '&amp;', 'and', 'g'
                ),
                -- strip &quot; and plain double-quotes
                E'(&quot;|")', '', 'g'
              ),
              -- strip numeric HTML entities (&#123;)
              '&#[0-9]+;', '', 'g'
            ),
            -- strip named HTML entities (&nbsp; etc.)
            '&[a-z]+;', '', 'gi'
          ),
          -- strip non-word, non-space, non-hyphen characters
          '[^\w\s\-]', '', 'g'
        ),
        -- collapse whitespace, underscores, and hyphens into a single hyphen
        '[\s_\-]+', '-', 'g'
      ),
      -- trim leading and trailing hyphens
      '^-+|-+$', '', 'g'
    )
  ) STORED;

-- Non-unique B-tree index for fast slug lookups.
-- Non-unique because two products can theoretically hash to the same slug
-- (e.g. "My App!" vs "My App?") — tiebreak is handled in application JS.
-- Partial index excludes soft-deleted rows to keep it lean.
CREATE INDEX IF NOT EXISTS idx_products_slug
  ON public.products (slug)
  WHERE is_deleted = false;
