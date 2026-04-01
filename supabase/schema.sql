-- ============================================================
-- YogaFlow — Supabase Schema
-- Run this entire file in the Supabase SQL editor.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'MODERATOR');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'TRIAL');

-- ─────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────

-- 1. users (mirrors auth.users, populated by trigger)
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  role          user_role NOT NULL DEFAULT 'USER',
  avatar_url    TEXT,
  classes_attended  INT NOT NULL DEFAULT 0,
  hours_practiced   FLOAT NOT NULL DEFAULT 0,
  streak            INT NOT NULL DEFAULT 0,
  last_active_date  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. instructors
CREATE TABLE IF NOT EXISTS public.instructors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  bio         TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. yoga_classes
CREATE TABLE IF NOT EXISTS public.yoga_classes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT,
  duration_mins  INT NOT NULL,
  video_url      TEXT NOT NULL,
  thumbnail_url  TEXT,
  instructor_id  UUID REFERENCES public.instructors(id),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  razorpay_sub_id  TEXT UNIQUE,
  plan_id          TEXT NOT NULL,
  status           subscription_status NOT NULL DEFAULT 'INACTIVE',
  trial_ends_at    TIMESTAMPTZ,
  valid_until      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

-- 5. entitlements
CREATE TABLE IF NOT EXISTS public.entitlements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_key  TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_key)
);
CREATE INDEX IF NOT EXISTS entitlements_product_key_idx ON public.entitlements(product_key);

-- 6. user_activity
CREATE TABLE IF NOT EXISTS public.user_activity (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id      UUID REFERENCES public.yoga_classes(id) ON DELETE SET NULL,
  duration_mins INT NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_activity_user_completed_idx ON public.user_activity(user_id, completed_at);

-- 7. asanas
CREATE TABLE IF NOT EXISTS public.asanas (
  id            TEXT PRIMARY KEY,
  english_name  TEXT NOT NULL,
  sanskrit_name TEXT NOT NULL,
  description   TEXT,
  benefits      TEXT,
  image_url     TEXT,
  difficulty    TEXT NOT NULL DEFAULT 'Beginner',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. saved_asanas
CREATE TABLE IF NOT EXISTS public.saved_asanas (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asana_id  TEXT NOT NULL REFERENCES public.asanas(id) ON DELETE CASCADE,
  saved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, asana_id)
);
CREATE INDEX IF NOT EXISTS saved_asanas_user_idx ON public.saved_asanas(user_id);

-- 9. community_conversations
CREATE TABLE IF NOT EXISTS public.community_conversations (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  author_id  UUID NOT NULL REFERENCES public.users(id),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. community_messages
CREATE TABLE IF NOT EXISTS public.community_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text            TEXT NOT NULL,
  author_id       UUID NOT NULL REFERENCES public.users(id),
  conversation_id TEXT NOT NULL REFERENCES public.community_conversations(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_messages_conv_created_idx ON public.community_messages(conversation_id, created_at);

-- 11. app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. contact_requests
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. newsletter_subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. research_topics
CREATE TABLE IF NOT EXISTS public.research_topics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  summary      TEXT NOT NULL,
  paper_link   TEXT,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- AUTH TRIGGER — auto-creates public.users on signup
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    'USER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- HELPER: is_admin() — used in RLS policies
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

-- users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "users_insert_trigger" ON public.users FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "subscriptions_update_own" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- entitlements
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entitlements_select_own" ON public.entitlements FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "entitlements_insert_own" ON public.entitlements FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "entitlements_update_own" ON public.entitlements FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- user_activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_select_own" ON public.user_activity FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "activity_insert_own" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- saved_asanas
ALTER TABLE public.saved_asanas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_asanas_select_own" ON public.saved_asanas FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "saved_asanas_insert_own" ON public.saved_asanas FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "saved_asanas_delete_own" ON public.saved_asanas FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- community_conversations — public read, auth write
ALTER TABLE public.community_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_select_all" ON public.community_conversations FOR SELECT USING (TRUE);
CREATE POLICY "conv_insert_admin" ON public.community_conversations FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "conv_update_admin" ON public.community_conversations FOR UPDATE USING (public.is_admin());

-- community_messages — public read, auth write own
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_select_all" ON public.community_messages FOR SELECT USING (TRUE);
CREATE POLICY "msg_insert_own" ON public.community_messages FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "msg_delete_own" ON public.community_messages FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- Public read-only tables (no auth required)
ALTER TABLE public.yoga_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "yoga_classes_select_all" ON public.yoga_classes FOR SELECT USING (TRUE);
CREATE POLICY "yoga_classes_write_admin" ON public.yoga_classes FOR ALL USING (public.is_admin());

ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instructors_select_all" ON public.instructors FOR SELECT USING (TRUE);
CREATE POLICY "instructors_write_admin" ON public.instructors FOR ALL USING (public.is_admin());

ALTER TABLE public.asanas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "asanas_select_all" ON public.asanas FOR SELECT USING (TRUE);
CREATE POLICY "asanas_write_admin" ON public.asanas FOR ALL USING (public.is_admin());

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select_all" ON public.app_settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_write_admin" ON public.app_settings FOR ALL USING (public.is_admin());

ALTER TABLE public.research_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "research_select_all" ON public.research_topics FOR SELECT USING (TRUE);
CREATE POLICY "research_write_admin" ON public.research_topics FOR ALL USING (public.is_admin());

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_insert_all" ON public.contact_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "contacts_select_admin" ON public.contact_requests FOR SELECT USING (public.is_admin());

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "newsletter_insert_all" ON public.newsletter_subscribers FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "newsletter_select_admin" ON public.newsletter_subscribers FOR SELECT USING (public.is_admin());
