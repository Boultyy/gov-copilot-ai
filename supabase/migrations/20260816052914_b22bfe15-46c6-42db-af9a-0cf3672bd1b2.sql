-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Schemes & Services Base
CREATE TABLE public.schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    ministry TEXT,
    description TEXT,
    benefits TEXT,
    eligibility_summary TEXT,
    deadline TEXT,
    type TEXT CHECK (type IN ('Central', 'State')),
    state_or_ut TEXT,
    official_source TEXT,
    source_url TEXT,
    last_verified_at TIMESTAMPTZ DEFAULT now(),
    verification_status TEXT DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    ministry TEXT,
    description TEXT,
    fee TEXT,
    timeline TEXT,
    official_source TEXT,
    source_url TEXT,
    last_verified_at TIMESTAMPTZ DEFAULT now(),
    verification_status TEXT DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Requirements & Steps
CREATE TABLE public.scheme_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID REFERENCES public.schemes(id) ON DELETE CASCADE NOT NULL,
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('document', 'eligibility')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.service_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.service_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    step_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    detail TEXT,
    estimated_days TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Documents & RAG
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    size_bytes BIGINT,
    mime_type TEXT,
    page_count INTEGER,
    status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'indexed', 'error')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Standard OpenAI embedding size
    page_number INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Applications
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    scheme_id UUID REFERENCES public.schemes(id),
    service_id UUID REFERENCES public.services(id),
    external_app_id TEXT, -- e.g. "APP-8829-X"
    status TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    estimated_completion_date DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.application_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    stage TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'current', 'upcoming')),
    event_date TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Conversations & AI
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    type TEXT CHECK (type IN ('copilot', 'document_chat', 'scheme_helper')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB, -- For citations, sources, or specific AI tags
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    generation_type TEXT NOT NULL, -- e.g. 'draft', 'policy_conflict', 'summary'
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Policy Analysis
CREATE TABLE public.policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.policy_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    policy_a_id UUID REFERENCES public.policies(id) ON DELETE CASCADE,
    policy_b_id UUID REFERENCES public.policies(id) ON DELETE CASCADE,
    result_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.policy_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id UUID REFERENCES public.policy_comparisons(id) ON DELETE CASCADE NOT NULL,
    severity TEXT CHECK (severity IN ('high', 'medium', 'low')),
    clause_title TEXT,
    doc_a_value TEXT,
    doc_b_value TEXT,
    issue TEXT,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Audit
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS & Permissions
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.schemes TO authenticated;
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT ON public.scheme_requirements TO authenticated;
GRANT SELECT ON public.service_requirements TO authenticated;
GRANT SELECT ON public.service_steps TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.document_chunks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT ON public.ai_generations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.policies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.policy_comparisons TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.policy_conflicts TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Policies (Basic authenticated ownership)
CREATE POLICY "Public schemes are viewable by all users" ON public.schemes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public services are viewable by all users" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Requirements are viewable by all users" ON public.scheme_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Svc Requirements are viewable by all users" ON public.service_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Svc Steps are viewable by all users" ON public.service_steps FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own documents" ON public.documents FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own chunks" ON public.document_chunks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.documents WHERE id = document_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their own applications" ON public.applications FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own app events" ON public.application_events FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their own conversations" ON public.conversations FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own messages" ON public.messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can view their own generations" ON public.ai_generations FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own policies" ON public.policies FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own comparisons" ON public.policy_comparisons FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own conflicts" ON public.policy_conflicts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.policy_comparisons WHERE id = comparison_id AND user_id = auth.uid()));
CREATE POLICY "Users can view their own logs" ON public.audit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
