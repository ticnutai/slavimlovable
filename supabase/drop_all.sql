-- Drop all tables in reverse dependency order to avoid foreign key constraints

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.update_project_started_at() CASCADE;

-- Drop tables in reverse order (CASCADE will drop triggers and policies)
DROP TABLE IF EXISTS public.task_notifications CASCADE;
DROP TABLE IF EXISTS public.task_dependencies CASCADE;
DROP TABLE IF EXISTS public.task_reminders CASCADE;
DROP TABLE IF EXISTS public.task_attachments CASCADE;
DROP TABLE IF EXISTS public.project_backups CASCADE;
DROP TABLE IF EXISTS public.kanban_statuses CASCADE;
DROP TABLE IF EXISTS public.project_tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Drop storage buckets
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete all files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view reminder sounds" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload sounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their sounds" ON storage.objects;

DELETE FROM storage.buckets WHERE id IN ('task-files', 'reminder-sounds');