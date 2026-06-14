-- Create an ENUMs
CREATE TYPE application_status AS ENUM ('Wishlist', 'Applied', 'Follow-up', 'Interview', 'Offer', 'Rejected');
CREATE TYPE priority_level AS ENUM ('Urgent', 'High', 'Medium', 'Low');
CREATE TYPE interview_round AS ENUM ('HR', 'Technical', 'Manager', 'Director', 'Final');
CREATE TYPE interview_mode AS ENUM ('In-Person', 'Video', 'Phone');

-- Create Tables
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    jd_link TEXT,
    location TEXT,
    salary TEXT,
    status application_status DEFAULT 'Wishlist',
    priority priority_level DEFAULT 'Medium',
    tags TEXT[] DEFAULT '{}',
    applied_date DATE,
    resume_ref TEXT,
    notes TEXT,
    recruiter TEXT,
    source TEXT,
    referral TEXT,
    application_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE status_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    status application_status NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    mode interview_mode NOT NULL,
    link TEXT,
    interviewer TEXT,
    round interview_round NOT NULL
);

CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    dark_mode BOOLEAN DEFAULT FALSE,
    monthly_goal INTEGER DEFAULT 20
);

-- Enable Row Level Security (RLS)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create Policies for applications
CREATE POLICY "Users can view their own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own applications" ON applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own applications" ON applications FOR DELETE USING (auth.uid() = user_id);

-- Create Policies for status_timeline
CREATE POLICY "Users can view their own timeline" ON status_timeline FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own timeline" ON status_timeline FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own timeline" ON status_timeline FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own timeline" ON status_timeline FOR DELETE USING (auth.uid() = user_id);

-- Create Policies for interviews
CREATE POLICY "Users can view their own interviews" ON interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own interviews" ON interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interviews" ON interviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interviews" ON interviews FOR DELETE USING (auth.uid() = user_id);

-- Create Policies for activity_log
CREATE POLICY "Users can view their own activity log" ON activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity log" ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activity log" ON activity_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activity log" ON activity_log FOR DELETE USING (auth.uid() = user_id);

-- Create Policies for settings
CREATE POLICY "Users can view their own settings" ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON settings FOR DELETE USING (auth.uid() = user_id);

-- Create a trigger to automatically create settings for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.settings (user_id, dark_mode, monthly_goal)
  VALUES (new.id, FALSE, 20);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
