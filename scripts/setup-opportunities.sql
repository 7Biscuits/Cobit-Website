-- ============================================================
-- CoBit Database Migration: Opportunities Table & RLS Policies
-- ============================================================
-- Run this migration in the Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql

-- 1. Create the opportunities table
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  eligibility TEXT,
  requirements TEXT,
  application_link TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- 3. Public policy: Anyone can view active/published opportunities
DROP POLICY IF EXISTS "Public can view published opportunities" ON public.opportunities;
CREATE POLICY "Public can view published opportunities"
  ON public.opportunities FOR SELECT
  USING (is_published = true);

-- 4. Admin policies: Authenticated users can view, insert, update, and delete
DROP POLICY IF EXISTS "Admins can view all opportunities" ON public.opportunities;
CREATE POLICY "Admins can view all opportunities"
  ON public.opportunities FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert opportunities" ON public.opportunities;
CREATE POLICY "Admins can insert opportunities"
  ON public.opportunities FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update opportunities" ON public.opportunities;
CREATE POLICY "Admins can update opportunities"
  ON public.opportunities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete opportunities" ON public.opportunities;
CREATE POLICY "Admins can delete opportunities"
  ON public.opportunities FOR DELETE
  TO authenticated
  USING (true);

-- 5. Enable Realtime updates on opportunities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'opportunities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities;
  END IF;
END $$;

-- 6. Insert initial seed opportunity (optional sample)
INSERT INTO public.opportunities (title, description, eligibility, requirements, application_link, is_published)
VALUES 
  (
    'Junior Robotics & IoT Student Fellow',
    'Join the CoBit hardware track to build sensor networks, autonomous micro-rovers, and embedded IoT prototypes under the guidance of industry engineers.',
    'High school students (Grades 9-12) or pre-college learners with interest in robotics, electronics, or coding.',
    'Basic familiarity with Python, C/C++, or block programming. Willingness to tinker, assemble hardware kits, and commit 4 hours/week.',
    'https://forms.gle/cobit-robotics-fellowship',
    true
  ),
  (
    'Web & Full-Stack Development Intern',
    'Work alongside startup mentors to develop modern client-side and cloud-connected web applications, interactive visual tools, and real student products.',
    'School and early college students passionate about frontend engineering and modern web technologies.',
    'Knowledge of HTML5, CSS3, JavaScript/ES6. Experience with Git or Three.js is a plus but not required.',
    'https://forms.gle/cobit-web-internship',
    true
  )
ON CONFLICT DO NOTHING;
