-- 0024_storage_bucket_limits.sql
-- Phase 6 security fix.
--
-- PROBLEM: property-media (0005), project-media (0006), and blog-media
-- (0010) were all created with only (id, name, public) -- no
-- file_size_limit or allowed_mime_types set at the bucket level. Every
-- upload component (PropertyMediaUpload.tsx, ProjectMediaUpload.tsx,
-- FeaturedImageUpload.tsx, AdminPropertyMediaUpload.tsx,
-- ReraCertificateUpload.tsx) only checks file.type/file.size in the
-- browser before calling supabase.storage.upload() -- a client-reported
-- MIME type and a check that runs entirely in JS the caller controls.
-- Anyone with a valid session (seller or admin) can call the Storage API
-- directly with their own access token and upload any file type or size
-- into their own owned path -- the ownership-path RLS policies (0005,
-- 0006, 0010) still apply, but nothing at the storage layer stops an
-- oversized file or an unexpected content type (e.g. an .svg/.html that
-- could carry a script, served back from a public bucket URL).
--
-- FIX: set allowed_mime_types/file_size_limit on each bucket to match
-- what the application's own upload components already claim to accept
-- (the widest limit across each bucket's upload components), so the
-- browser-side checks become a UX nicety backed by a real server-side
-- boundary rather than the only boundary.
--
-- No RLS policy changes, no path/ownership changes, no data migration.
-- Existing objects already in each bucket are unaffected -- these limits
-- apply going forward to new uploads only (Supabase Storage does not
-- retroactively validate existing objects).

-- property-media: PropertyMediaUpload.tsx (seller) and
-- AdminPropertyMediaUpload.tsx (admin) -- images up to 10MB, video up to
-- 50MB. Bucket limit is the wider of the two (video).
update storage.buckets
set
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/webm'
  ]
where id = 'property-media';

-- project-media: ProjectMediaUpload.tsx (gallery/master_plan/floor_plan
-- images, document PDFs, video, all up to 25MB) and
-- ReraCertificateUpload.tsx, which deliberately reuses this same bucket
-- (see 0015's comment) -- PDF/images up to 25MB. Bucket limit is the
-- widest across both: 25MB, images + PDF + video.
update storage.buckets
set
  file_size_limit = 26214400, -- 25MB
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'video/mp4', 'video/webm'
  ]
where id = 'project-media';

-- blog-media: FeaturedImageUpload.tsx -- images only, up to 10MB.
update storage.buckets
set
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'blog-media';

comment on column storage.buckets.file_size_limit is
  'Phase 6 (0024): server-side ceiling matching each bucket''s upload '
  'components, so the browser-side size check is backed by a real '
  'boundary rather than being the only one.';
