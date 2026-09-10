CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'candidate')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weeks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_title VARCHAR(255) NOT NULL,
    objective TEXT NOT NULL,
    resources TEXT,
    deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    github_url VARCHAR(500),
    deployed_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    reflection TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_id)
);

CREATE TABLE review_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id UUID NOT NULL REFERENCES review_files(id) ON DELETE CASCADE,
    tool_type VARCHAR(50) NOT NULL,
    coordinates JSONB NOT NULL,
    color VARCHAR(20) DEFAULT '#7C3AED',
    text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    status VARCHAR(20) DEFAULT 'To Do' CHECK (status IN ('To Do', 'Fixed')),
    reference_file_url VARCHAR(500),
    mark_deduction DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    ui DECIMAL(5,2) DEFAULT 0 CHECK (ui >= 0 AND ui <= 20),
    functionality DECIMAL(5,2) DEFAULT 0 CHECK (functionality >= 0 AND functionality <= 25),
    github DECIMAL(5,2) DEFAULT 0 CHECK (github >= 0 AND github <= 15),
    documentation DECIMAL(5,2) DEFAULT 0 CHECK (documentation >= 0 AND documentation <= 10),
    innovation DECIMAL(5,2) DEFAULT 0 CHECK (innovation >= 0 AND innovation <= 20),
    weekly_progress DECIMAL(5,2) DEFAULT 0 CHECK (weekly_progress >= 0 AND weekly_progress <= 10),
    total DECIMAL(5,2) DEFAULT 0,
    grade VARCHAR(10),
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id)
);

CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_week ON submissions(week_id);
CREATE INDEX idx_review_files_submission ON review_files(submission_id);
CREATE INDEX idx_annotations_image ON annotations(image_id);
CREATE INDEX idx_issues_annotation ON issues(annotation_id);
CREATE INDEX idx_grades_submission ON grades(submission_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_weeks_updated_at BEFORE UPDATE ON weeks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_annotations_updated_at BEFORE UPDATE ON annotations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@portal.com', 'scrypt:32768:8:1$ZZZCvMnfD2WpoydO$62b80e7c3034d7c7b209c4ad7e572b23658a2b3e4f182f8c2432f9eafea00602488e5e71cb5f84003702028286dcc472bf070bb11301c288b2330f03f2162f4d', 'admin');
