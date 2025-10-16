-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create categories table (פרטים, תיק מידע, תוכניות, בקשת היתר)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create tasks table (משימות תחת כל קטגוריה)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;


-- Create folders table
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  address TEXT,
  gush TEXT,
  parcel TEXT,
  plot TEXT,
  priority INTEGER,
  folder_id UUID REFERENCES public.folders(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create project_tasks table (סטטוס של משימות לכל פרויקט)
CREATE TABLE public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, task_id)
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for categories
CREATE POLICY "Authenticated users can view categories"
ON public.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tasks
CREATE POLICY "Authenticated users can view tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage tasks"
ON public.tasks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for projects
CREATE POLICY "Authenticated users can view projects"
ON public.projects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all projects"
ON public.projects FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for project_tasks
CREATE POLICY "Authenticated users can view project tasks"
ON public.project_tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update project tasks"
ON public.project_tasks FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can manage project tasks"
ON public.project_tasks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
BEFORE UPDATE ON public.project_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  
  -- First user becomes admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Insert default categories
INSERT INTO public.categories (name, display_name, order_index, color) VALUES
  ('details', 'פרטים', 1, '#3B82F6'),
  ('info_file', 'תיק מידע', 2, '#10B981'),
  ('plans', 'תוכניות', 3, '#F59E0B'),
  ('permit_request', 'בקשת היתר', 4, '#EF4444');
-- Insert tasks for category 'פרטים' (details)
INSERT INTO public.tasks (category_id, name, description, order_index, is_required)
SELECT 
  c.id,
  task_name,
  task_description,
  task_order,
  task_required
FROM public.categories c,
(VALUES
  ('שם הפרויקט', 'הזנת שם הפרויקט', 1, true),
  ('כתובת', 'הזנת כתובת הנכס', 2, true),
  ('גוש', 'מספר גוש', 3, true),
  ('חלקה', 'מספר חלקה', 4, true),
  ('מגרש', 'מספר מגרש', 5, true),
  ('שם לקוח', 'שם הלקוח', 6, true),
  ('טלפון', 'מספר טלפון ליצירת קשר', 7, true),
  ('אימייל', 'כתובת אימייל', 8, false),
  ('מייל נוסף', 'כתובת אימייל נוספת', 9, false)
) AS t(task_name, task_description, task_order, task_required)
WHERE c.name = 'details';

-- Insert tasks for category 'תיק מידע' (info_file)
INSERT INTO public.tasks (category_id, name, description, order_index, is_required)
SELECT 
  c.id,
  task_name,
  task_description,
  task_order,
  task_required
FROM public.categories c,
(VALUES
  ('מסמכי בעלות', 'תעודת בעלות ומסמכים נלווים', 1, true),
  ('תב״ע', 'תכנית בנין עיר', 2, true),
  ('היסטוריית הנכס', 'מידע היסטורי על הנכס', 3, false),
  ('סקר', 'סקר מודד מוסמך', 4, true),
  ('תנאי פריסה', 'תנאים להיתר', 5, true),
  ('הערות לקוח', 'הערות והעדפות הלקוח', 6, false),
  ('בדיקת זכויות', 'בדיקת זכויות בנייה', 7, true),
  ('תצ״ר', 'תכנית צמודת קרקע', 8, false),
  ('מפה', 'מפות רלוונטיות', 9, false)
) AS t(task_name, task_description, task_order, task_required)
WHERE c.name = 'info_file';

-- Insert tasks for category 'תוכניות' (plans)
INSERT INTO public.tasks (category_id, name, description, order_index, is_required)
SELECT 
  c.id,
  task_name,
  task_description,
  task_order,
  task_required
FROM public.categories c,
(VALUES
  ('הצעת תכנון', 'הצגת הצעת תכנון ללקוח', 1, true),
  ('אישור לקוח', 'קבלת אישור לקוח על התכנון', 2, true),
  ('תכנית אדריכלית', 'הכנת תכנית אדריכלית מפורטת', 3, true),
  ('תכנית קונסטרוקציה', 'תכנון קונסטרוקטיבי', 4, true),
  ('תכנית חשמל', 'תכנון מערכת חשמל', 5, true),
  ('תכנית אינסטלציה', 'תכנון מערכת אינסטלציה', 6, true),
  ('תכנית ניקוז', 'תכנון מערכת ניקוז', 7, true),
  ('תכנית תיאום', 'תיאום בין כל המערכות', 8, true),
  ('חתכים', 'חתכים אדריכליים', 9, true),
  ('חזיתות', 'תכנון חזיתות', 10, true),
  ('פרטים', 'פרטים אדריכליים', 11, false),
  ('תלת מימד', 'תכנון תלת מימדי', 12, false),
  ('רנדרים', 'הדמיות ויזואליות', 13, false),
  ('סרטון', 'סרטון הדמיה', 14, false)
) AS t(task_name, task_description, task_order, task_required)
WHERE c.name = 'plans';

-- Insert tasks for category 'בקשת היתר' (permit_request)
INSERT INTO public.tasks (category_id, name, description, order_index, is_required)
SELECT 
  c.id,
  task_name,
  task_description,
  task_order,
  task_required
FROM public.categories c,
(VALUES
  ('הכנת מסמכים', 'הכנת כל המסמכים לבקשה', 1, true),
  ('טופס 4', 'מילוי טופס 4', 2, true),
  ('הצהרות', 'הצהרות נדרשות', 3, true),
  ('חתימות', 'איסוף חתימות', 4, true),
  ('תשלום אגרות', 'תשלום אגרות עירייה', 5, true),
  ('הגשה', 'הגשת הבקשה', 6, true),
  ('קבלת אישור עקרוני', 'קבלת אישור עקרוני מהעירייה', 7, true),
  ('טיפול בהערות', 'מענה להערות הועדה', 8, false),
  ('אישור ועדה', 'קבלת אישור ועדת תכנון', 9, true),
  ('היתר בנייה', 'קבלת היתר בנייה סופי', 10, true),
  ('העתק היתר ללקוח', 'העברת העתק היתר ללקוח', 11, true),
  ('סיום פרויקט', 'סגירת תיק הפרויקט', 12, true),
  ('מעקב ביצוע', 'מעקב אחר ביצוע בפועל', 13, false),
  ('תיקונים', 'תיקונים במידת הצורך', 14, false),
  ('אחריות', 'אחריות לתקופה מוגדרת', 15, false),
  ('ארכיון', 'העברה לארכיון', 16, false)
) AS t(task_name, task_description, task_order, task_required)
WHERE c.name = 'permit_request';
-- Add helpful indices for better performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_task_id ON public.project_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_completed ON public.project_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON public.tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON public.tasks(order_index);
CREATE INDEX IF NOT EXISTS idx_categories_order_index ON public.categories(order_index);

-- Add helpful comments for documentation
COMMENT ON TABLE public.project_tasks IS 'Links tasks to specific projects with completion status';
COMMENT ON TABLE public.tasks IS 'Master list of tasks that can be assigned to projects';
COMMENT ON TABLE public.categories IS 'Task categories for organizing workflow';
COMMENT ON TABLE public.projects IS 'Client projects with address and land registry details';
-- שלב 1: הוספת עמודות לניהול זמנים ותאריכים

-- הוספת עמודות לטבלת tasks
ALTER TABLE tasks
ADD COLUMN due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN estimated_hours INTEGER,
ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- הוספת עמודות לטבלת project_tasks
ALTER TABLE project_tasks
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN due_date_override TIMESTAMP WITH TIME ZONE,
ADD COLUMN actual_hours INTEGER DEFAULT 0;

-- יצירת אינדקסים לביצועים טובים יותר
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_project_tasks_due_date ON project_tasks(due_date_override);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- עדכון task order_index להיות nullable אם לא כבר
ALTER TABLE tasks ALTER COLUMN order_index DROP NOT NULL;
-- שלב 2: ניהול קבצים - יצירת טבלת קבצים מצורפים

-- יצירת טבלת קבצים מצורפים
CREATE TABLE task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view attachments"
ON task_attachments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can upload attachments"
ON task_attachments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own attachments"
ON task_attachments FOR DELETE
TO authenticated
USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all attachments"
ON task_attachments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- יצירת Storage bucket לקבצים
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-files', 'task-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies עבור Storage
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-files');

CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'task-files');

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-files' AND auth.uid()::text = owner::text);

CREATE POLICY "Admins can delete all files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-files' AND has_role(auth.uid(), 'admin'));
-- מערכת תזכורות למשימות

-- יצירת טבלת תזכורות
CREATE TABLE task_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE NOT NULL,
    reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT,
    sound_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reminders"
ON task_reminders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create reminders"
ON task_reminders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their reminders"
ON task_reminders FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their reminders"
ON task_reminders FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all reminders"
ON task_reminders FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- יצירת Storage bucket לקבצי צליל
INSERT INTO storage.buckets (id, name, public)
VALUES ('reminder-sounds', 'reminder-sounds', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies עבור Storage
CREATE POLICY "Anyone can view reminder sounds"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reminder-sounds');

CREATE POLICY "Authenticated users can upload sounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reminder-sounds');

CREATE POLICY "Users can delete their sounds"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reminder-sounds' AND auth.uid()::text = owner::text);

-- אינדקסים לביצועים
CREATE INDEX idx_reminders_time ON task_reminders(reminder_time) WHERE is_active = true;
CREATE INDEX idx_reminders_project_task ON task_reminders(project_task_id);

-- Trigger לעדכון updated_at
CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON task_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create project_backups table for storing backups in database
CREATE TABLE project_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  backup_name TEXT NOT NULL,
  backup_data JSONB NOT NULL,
  files_metadata JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  backup_size BIGINT NOT NULL,
  backup_type TEXT CHECK (backup_type IN ('manual', 'auto', 'scheduled')) DEFAULT 'manual',
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_project_backups_project ON project_backups(project_id);
CREATE INDEX idx_project_backups_created_at ON project_backups(created_at DESC);

-- Enable RLS
ALTER TABLE project_backups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view project backups"
ON project_backups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_backups.project_id
  )
);

CREATE POLICY "Authenticated users can create backups"
ON project_backups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Backup creator or admin can delete"
ON project_backups FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage all backups"
ON project_backups FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));
-- Phase 1: Add progress, assigned_to, and assigned_at columns to project_tasks
ALTER TABLE project_tasks 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Phase 2: Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_project ON task_dependencies(project_id);

-- Enable RLS on task_dependencies
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_dependencies
CREATE POLICY "Authenticated users can view task dependencies"
ON task_dependencies FOR SELECT
USING (true);

CREATE POLICY "Admins can manage task dependencies"
ON task_dependencies FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create task dependencies"
ON task_dependencies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = task_dependencies.project_id
  )
);

CREATE POLICY "Authenticated users can delete their project task dependencies"
ON task_dependencies FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = task_dependencies.project_id
  )
);

-- Phase 4: Create task_notifications table
CREATE TABLE IF NOT EXISTS task_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT CHECK (notification_type IN ('due_soon', 'overdue', 'dependency_completed', 'assigned', 'task_completed')),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_notifications_user ON task_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_project_task ON task_notifications(project_task_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_read ON task_notifications(is_read);

-- Enable RLS on task_notifications
ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_notifications
CREATE POLICY "Users can view their own notifications"
ON task_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON task_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON task_notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
ON task_notifications FOR ALL
USING (has_role(auth.uid(), 'admin'));
-- Create table for custom kanban statuses
CREATE TABLE IF NOT EXISTS public.kanban_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  order_index INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT 'circle',
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kanban_statuses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view kanban statuses"
  ON public.kanban_statuses
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage kanban statuses"
  ON public.kanban_statuses
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_kanban_statuses_updated_at
  BEFORE UPDATE ON public.kanban_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default statuses (global - no project_id)
INSERT INTO public.kanban_statuses (name, label, color, order_index, icon) VALUES
  ('pending', 'ממתין', '#6B7280', 1, 'circle'),
  ('in_progress', 'בביצוע', '#3B82F6', 2, 'clock'),
  ('review', 'בבדיקה', '#F59E0B', 3, 'alert-circle'),
  ('completed', 'הושלם', '#10B981', 4, 'check-circle-2')
ON CONFLICT DO NOTHING;
-- Fix RLS policy for project_tasks to allow updates
-- Drop existing policy and recreate with proper WITH CHECK
DROP POLICY IF EXISTS "Authenticated users can update project tasks" ON public.project_tasks;

-- Recreate policy with both USING and WITH CHECK expressions
CREATE POLICY "Authenticated users can update project tasks"
ON public.project_tasks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Also ensure INSERT policy exists with WITH CHECK
DROP POLICY IF EXISTS "Authenticated users can insert project tasks" ON public.project_tasks;

CREATE POLICY "Authenticated users can insert project tasks"
ON public.project_tasks
FOR INSERT
TO authenticated
WITH CHECK (true);
-- Add timeline tracking fields to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS target_completion_days INTEGER,
ADD COLUMN IF NOT EXISTS actual_completion_date TIMESTAMP WITH TIME ZONE;

-- Add timeline tracking fields to categories table
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS target_days INTEGER,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Add start_date field to project_tasks if not exists
ALTER TABLE public.project_tasks
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;

-- Update existing projects to set started_at based on created_at
UPDATE public.projects
SET started_at = created_at
WHERE started_at IS NULL;

-- Create function to auto-update project started_at when first task starts
CREATE OR REPLACE FUNCTION update_project_started_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.started_at IS NOT NULL AND OLD.started_at IS NULL THEN
    UPDATE projects
    SET started_at = LEAST(COALESCE(started_at, NEW.started_at), NEW.started_at)
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating project started_at
DROP TRIGGER IF EXISTS trigger_update_project_started_at ON project_tasks;
CREATE TRIGGER trigger_update_project_started_at
  AFTER UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_started_at();
-- Fix search_path for update_project_started_at function
CREATE OR REPLACE FUNCTION update_project_started_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.started_at IS NOT NULL AND OLD.started_at IS NULL THEN
    UPDATE projects
    SET started_at = LEAST(COALESCE(started_at, NEW.started_at), NEW.started_at)
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;
