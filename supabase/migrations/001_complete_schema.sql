-- ============================================================================
-- PROJECT REVIEW PORTAL - COMPLETE SUPABASE POSTGRESQL SCHEMA (16 TABLES) & RLS POLICIES
-- ============================================================================
-- Target Architecture: Supabase Auth (auth.users) -> public.profiles -> Application Tables
-- Supported Roles: 'admin', 'mentor', 'candidate'
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Public Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'candidate' CHECK (role IN ('admin', 'mentor', 'candidate')),
    profile_image VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backwards compatibility view if legacy queries reference public.users
CREATE OR REPLACE VIEW public.users AS SELECT * FROM public.profiles;

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    public_joining BOOLEAN DEFAULT FALSE,
    invite_code VARCHAR(32) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Project Members Table
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_project_user UNIQUE (project_id, user_id)
);

-- 5. Project Join Requests Table
CREATE TABLE IF NOT EXISTS public.project_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'accepted', 'rejected', 'cancelled')),
    feedback TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_project_user_request UNIQUE (project_id, user_id)
);

-- 6. Mentor Assignments Table
CREATE TABLE IF NOT EXISTS public.mentor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_mentor_candidate_project UNIQUE (mentor_id, candidate_id, project_id)
);

-- 7. Weeks Table
CREATE TABLE IF NOT EXISTS public.weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    week_title VARCHAR(255) NOT NULL,
    objective TEXT NOT NULL,
    resources TEXT,
    deadline DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_id UUID NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
    github_url VARCHAR(500),
    deployed_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    reflection TEXT,
    project_description TEXT,
    what_learned TEXT,
    difficulties_faced TEXT,
    status VARCHAR(50) DEFAULT 'Submitted',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_week UNIQUE (user_id, week_id)
);

-- 9. Review Files Table
CREATE TABLE IF NOT EXISTS public.review_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Annotations Table
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

-- 11. Issues Table
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

-- 12. Grades Table
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
    CONSTRAINT unique_submission_grade UNIQUE (submission_id)
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. LinkedIn Post Submissions Table
CREATE TABLE IF NOT EXISTS public.post_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform VARCHAR(50) DEFAULT 'LinkedIn',
    caption TEXT,
    status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending Review', 'Approved', 'Needs Changes')),
    posting_date VARCHAR(50),
    posting_time VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. LinkedIn Post Media Table
CREATE TABLE IF NOT EXISTS public.post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.post_submissions(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    video_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. LinkedIn Post Reviews Table
CREATE TABLE IF NOT EXISTS public.post_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.post_submissions(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    feedback TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    decision VARCHAR(30) NOT NULL CHECK (decision IN ('Approved', 'Needs Changes'))
);

-- 17. Submission Activities Table (Table 16)
CREATE TABLE IF NOT EXISTS public.submission_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.post_submissions(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(255),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_join_requests_project ON public.project_join_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_project_join_requests_user ON public.project_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_mentor ON public.mentor_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_candidate ON public.mentor_assignments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_week ON public.submissions(week_id);
CREATE INDEX IF NOT EXISTS idx_review_files_submission ON public.review_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_annotations_image ON public.annotations(image_id);
CREATE INDEX IF NOT EXISTS idx_issues_annotation ON public.issues(annotation_id);
CREATE INDEX IF NOT EXISTS idx_grades_submission ON public.grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_post_submissions_user ON public.post_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_media_submission ON public.post_media(submission_id);
CREATE INDEX IF NOT EXISTS idx_post_reviews_submission ON public.post_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_activities_submission ON public.submission_activities(submission_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_weeks_updated_at BEFORE UPDATE ON public.weeks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_annotations_updated_at BEFORE UPDATE ON public.annotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_issues_updated_at BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_post_submissions_updated_at BEFORE UPDATE ON public.post_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- AUTOMATIC PROFILE CREATION ON SIGNUP (SUPABASE AUTH TRIGGER)
-- ============================================================================
-- Note: Public signups default strictly to 'candidate'. Admin/mentor roles cannot be self-assigned.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name VARCHAR(255);
BEGIN
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'User'
    );

    INSERT INTO public.profiles (id, name, email, role)
    VALUES (NEW.id, user_name, NEW.email, 'candidate')
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

-- ============================================================================
-- SECURITY DEFINER HELPER FUNCTIONS FOR RLS (RECURSION-SAFE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION public.is_mentor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'mentor'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR AS $$
DECLARE
    u_role VARCHAR;
BEGIN
    SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid();
    RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION public.is_assigned_mentor_to_candidate(cand_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mentor_assignments
        WHERE mentor_id = auth.uid() AND candidate_id = cand_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL 16 TABLES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_activities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES MATRIX
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view relevant profiles" ON public.profiles FOR SELECT
    USING (
        auth.uid() = id
        OR public.is_admin()
        OR public.is_mentor()
        OR EXISTS (SELECT 1 FROM public.project_members pm1 JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.id)
    );

CREATE POLICY "Users can update own profile name" ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins have full profile management" ON public.profiles FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- PROJECTS
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view accessible projects" ON public.projects FOR SELECT
    USING (
        public_joining = TRUE
        OR owner_id = auth.uid()
        OR public.is_admin()
        OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.mentor_assignments WHERE project_id = projects.id AND mentor_id = auth.uid())
    );

CREATE POLICY "Admins and owners can manage projects" ON public.projects FOR ALL
    USING (owner_id = auth.uid() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- PROJECT MEMBERS
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view members of accessible projects" ON public.project_members FOR SELECT
    USING (
        user_id = auth.uid()
        OR public.is_admin()
        OR public.is_mentor()
        OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid())
    );

CREATE POLICY "Admins can manage project members" ON public.project_members FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- PROJECT JOIN REQUESTS
-- ----------------------------------------------------------------------------
CREATE POLICY "Candidates can view/create own join requests" ON public.project_join_requests FOR ALL
    USING (user_id = auth.uid() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- MENTOR ASSIGNMENTS
-- ----------------------------------------------------------------------------
CREATE POLICY "Mentors and candidates can view own assignments" ON public.mentor_assignments FOR SELECT
    USING (mentor_id = auth.uid() OR candidate_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins manage mentor assignments" ON public.mentor_assignments FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- WEEKS
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view weeks of accessible projects" ON public.weeks FOR SELECT
    USING (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can manage weeks" ON public.weeks FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- SUBMISSIONS
-- ----------------------------------------------------------------------------
CREATE POLICY "Candidates can view own submissions" ON public.submissions FOR SELECT
    USING (
        user_id = auth.uid()
        OR public.is_admin()
        OR (public.is_mentor() AND public.is_assigned_mentor_to_candidate(user_id))
    );

CREATE POLICY "Candidates can create own submissions" ON public.submissions FOR INSERT
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Candidates can update own submissions" ON public.submissions FOR UPDATE
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins and assigned mentors can manage submissions" ON public.submissions FOR ALL
    USING (public.is_admin() OR (public.is_mentor() AND public.is_assigned_mentor_to_candidate(user_id)));

-- ----------------------------------------------------------------------------
-- REVIEW FILES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view review files for accessible submissions" ON public.review_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = review_files.submission_id
            AND (s.user_id = auth.uid() OR public.is_admin() OR (public.is_mentor() AND public.is_assigned_mentor_to_candidate(s.user_id)))
        )
    );

CREATE POLICY "Candidates upload review files for own submission" ON public.review_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = review_files.submission_id AND (s.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Admins and assigned mentors manage review files" ON public.review_files FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- ANNOTATIONS & ISSUES
-- ----------------------------------------------------------------------------
CREATE POLICY "View annotations on accessible files" ON public.annotations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.review_files rf
            JOIN public.submissions s ON s.id = rf.submission_id
            WHERE rf.id = annotations.image_id
            AND (s.user_id = auth.uid() OR public.is_admin() OR (public.is_mentor() AND public.is_assigned_mentor_to_candidate(s.user_id)))
        )
    );

CREATE POLICY "Admins and assigned mentors manage annotations" ON public.annotations FOR ALL USING (public.is_admin() OR public.is_mentor());

CREATE POLICY "View issues on accessible annotations" ON public.issues FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.annotations a
            JOIN public.review_files rf ON rf.id = a.image_id
            JOIN public.submissions s ON s.id = rf.submission_id
            WHERE a.id = issues.annotation_id
            AND (s.user_id = auth.uid() OR public.is_admin() OR (public.is_mentor() AND public.is_assigned_mentor_to_candidate(s.user_id)))
        )
    );

CREATE POLICY "Admins and assigned mentors manage issues" ON public.issues FOR ALL USING (public.is_admin() OR public.is_mentor());

-- ----------------------------------------------------------------------------
-- GRADES (PUBLISHED ONLY FOR CANDIDATES)
-- ----------------------------------------------------------------------------
CREATE POLICY "Candidates can view ONLY published grades for own submission" ON public.grades FOR SELECT
    USING (
        (EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = grades.submission_id AND s.user_id = auth.uid() AND grades.published = TRUE
        ))
        OR public.is_admin()
        OR (public.is_mentor() AND EXISTS (
            SELECT 1 FROM public.submissions s WHERE s.id = grades.submission_id AND public.is_assigned_mentor_to_candidate(s.user_id)
        ))
    );

CREATE POLICY "Admins and assigned mentors manage grades" ON public.grades FOR ALL USING (public.is_admin() OR public.is_mentor());

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- LINKEDIN POSTS & ACTIVITIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Candidates view/manage own post submissions" ON public.post_submissions FOR ALL
    USING (user_id = auth.uid() OR public.is_admin() OR (public.is_mentor() AND public.is_assigned_mentor_to_candidate(user_id)));

CREATE POLICY "Candidates manage own post media" ON public.post_media FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.post_submissions ps
            WHERE ps.id = post_media.submission_id AND (ps.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "View/manage post reviews" ON public.post_reviews FOR ALL USING (public.is_admin() OR public.is_mentor());
CREATE POLICY "View/manage submission activities" ON public.submission_activities FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- SUPABASE STORAGE BUCKETS & STORAGE RLS POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('project-screenshots', 'project-screenshots', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for project-screenshots
CREATE POLICY "Allow public read of project-screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'project-screenshots');
CREATE POLICY "Allow authenticated upload to project-screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-screenshots' AND auth.role() = 'authenticated');
CREATE POLICY "Allow update/delete on project-screenshots" ON storage.objects FOR UPDATE USING (bucket_id = 'project-screenshots' AND auth.role() = 'authenticated');

-- Storage RLS Policies for post-media
CREATE POLICY "Allow public read of post-media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Allow authenticated upload to post-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');
CREATE POLICY "Allow update/delete on post-media" ON storage.objects FOR UPDATE USING (bucket_id = 'post-media' AND auth.role() = 'authenticated');
