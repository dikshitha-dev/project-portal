-- ============================================================================
-- PROJECT REVIEW PORTAL - SUPABASE MIGRATION SCHEMA & RLS POLICIES
-- ============================================================================
-- Target Architecture: Supabase Auth (auth.users) -> public.users (profile) -> Application Data
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Public Profiles Table (Linked directly to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'candidate' CHECK (role IN ('admin', 'candidate')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Application Tables
CREATE TABLE IF NOT EXISTS public.weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_title VARCHAR(255) NOT NULL,
    objective TEXT NOT NULL,
    resources TEXT,
    deadline DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    week_id UUID NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
    github_url VARCHAR(500),
    deployed_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_week UNIQUE(user_id, week_id)
);

CREATE TABLE IF NOT EXISTS public.review_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES public.review_files(id) ON DELETE CASCADE,
    tool_type VARCHAR(50) NOT NULL,
    coordinates JSONB NOT NULL,
    color VARCHAR(20) DEFAULT '#7C3AED',
    text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID NOT NULL REFERENCES public.annotations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    status VARCHAR(20) DEFAULT 'To Do' CHECK (status IN ('To Do', 'Fixed')),
    reference_file_url VARCHAR(500),
    mark_deduction DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    ui DECIMAL(5,2) DEFAULT 0 CHECK (ui >= 0 AND ui <= 20),
    functionality DECIMAL(5,2) DEFAULT 0 CHECK (functionality >= 0 AND functionality <= 25),
    github DECIMAL(5,2) DEFAULT 0 CHECK (github >= 0 AND github <= 15),
    documentation DECIMAL(5,2) DEFAULT 0 CHECK (documentation >= 0 AND documentation <= 10),
    innovation DECIMAL(5,2) DEFAULT 0 CHECK (innovation >= 0 AND innovation <= 20),
    weekly_progress DECIMAL(5,2) DEFAULT 0 CHECK (weekly_progress >= 0 AND weekly_progress <= 10),
    total DECIMAL(5,2) DEFAULT 0,
    grade VARCHAR(10),
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_submission_grade UNIQUE(submission_id)
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_week ON public.submissions(week_id);
CREATE INDEX IF NOT EXISTS idx_review_files_submission ON public.review_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_annotations_image ON public.annotations(image_id);
CREATE INDEX IF NOT EXISTS idx_issues_annotation ON public.issues(annotation_id);
CREATE INDEX IF NOT EXISTS idx_grades_submission ON public.grades(submission_id);

-- 5. Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_weeks_updated_at BEFORE UPDATE ON public.weeks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_annotations_updated_at BEFORE UPDATE ON public.annotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_issues_updated_at BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6. Automatic Public User Profile Creation Trigger (on Supabase Auth Signup)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(20);
    user_name VARCHAR(255);
BEGIN
    -- Extract role from metadata (defaults to 'candidate')
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'candidate');
    IF user_role NOT IN ('admin', 'candidate') THEN
        user_role := 'candidate';
    END IF;

    -- Extract name from metadata
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'User'
    );

    INSERT INTO public.users (id, name, email, role)
    VALUES (NEW.id, user_name, NEW.email, user_role)
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        email = EXCLUDED.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 7. SECURITY DEFINER Helper Function for Role Verification (Prevents RLS Recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR AS $$
DECLARE
    u_role VARCHAR;
BEGIN
    SELECT role INTO u_role FROM public.users WHERE id = auth.uid();
    RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- 8. Enable Row Level Security (RLS) on All Tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies

-- ----------------------------------------------------------------------------
-- TABLE: public.users
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile name"
    ON public.users FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins have full access to users"
    ON public.users FOR ALL
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- TABLE: public.weeks
-- ----------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view weeks"
    ON public.weeks FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage weeks"
    ON public.weeks FOR ALL
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- TABLE: public.submissions
-- ----------------------------------------------------------------------------
CREATE POLICY "Candidates can view their own submissions"
    ON public.submissions FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Candidates can create their own submissions"
    ON public.submissions FOR INSERT
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Candidates can update their own submissions"
    ON public.submissions FOR UPDATE
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Candidates can delete their own submissions"
    ON public.submissions FOR DELETE
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage all submissions"
    ON public.submissions FOR ALL
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- TABLE: public.review_files
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view review files for their submissions"
    ON public.review_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = review_files.submission_id AND (s.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Candidates can upload review files for their submissions"
    ON public.review_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = review_files.submission_id AND (s.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Admins can manage all review files"
    ON public.review_files FOR ALL
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- TABLE: public.annotations
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view annotations on accessible review files"
    ON public.annotations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.review_files rf
            JOIN public.submissions s ON s.id = rf.submission_id
            WHERE rf.id = annotations.image_id AND (s.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Admins can manage all annotations"
    ON public.annotations FOR ALL
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- TABLE: public.issues
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view issues on accessible annotations"
    ON public.issues FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.annotations a
            JOIN public.review_files rf ON rf.id = a.image_id
            JOIN public.submissions s ON s.id = rf.submission_id
            WHERE a.id = issues.annotation_id AND (s.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Admins can manage all issues"
    ON public.issues FOR ALL
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- TABLE: public.grades
-- ----------------------------------------------------------------------------
CREATE POLICY "Candidates can view published grades for their submissions"
    ON public.grades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = grades.submission_id AND s.user_id = auth.uid() AND grades.published = TRUE
        )
        OR public.is_admin()
    );

CREATE POLICY "Admins can manage all grades"
    ON public.grades FOR ALL
    USING (public.is_admin());
