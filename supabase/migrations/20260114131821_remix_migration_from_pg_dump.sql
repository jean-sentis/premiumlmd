CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: contact_preference; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.contact_preference AS ENUM (
    'email',
    'sms'
);


--
-- Name: lot_action_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lot_action_type AS ENUM (
    'purchase_order',
    'phone_bid',
    'memorize',
    'info_request'
);


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: alert_lot_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alert_lot_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lot_id uuid NOT NULL,
    alert_id uuid NOT NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bordereaux; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bordereaux (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lot_id uuid,
    sale_id uuid,
    bordereau_number text NOT NULL,
    adjudication_price integer NOT NULL,
    fees_amount integer NOT NULL,
    total_ttc integer NOT NULL,
    pdf_url text,
    status text DEFAULT 'pending'::text NOT NULL,
    paid_at timestamp with time zone,
    payment_method text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bordereaux_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])))
);


--
-- Name: info_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.info_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lot_id uuid NOT NULL,
    message text NOT NULL,
    response text,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: interencheres_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interencheres_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    house_id text NOT NULL,
    raw_data jsonb NOT NULL,
    scraped_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL
);


--
-- Name: interencheres_expositions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interencheres_expositions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id uuid,
    exposition_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    location text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: interencheres_lots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interencheres_lots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id uuid,
    interencheres_lot_id text NOT NULL,
    lot_number integer NOT NULL,
    title text NOT NULL,
    description text,
    estimate_low integer,
    estimate_high integer,
    estimate_currency text DEFAULT 'EUR'::text,
    lot_url text NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    categories jsonb DEFAULT '[]'::jsonb,
    dimensions text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    adjudication_price integer,
    is_after_sale boolean DEFAULT false,
    after_sale_price integer,
    after_sale_end_date date,
    winner_user_id uuid
);


--
-- Name: interencheres_sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interencheres_sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    interencheres_id text,
    house_id text DEFAULT '316'::text NOT NULL,
    title text NOT NULL,
    sale_type text,
    sale_date timestamp with time zone,
    location text,
    lot_count integer,
    catalog_url text,
    sale_url text NOT NULL,
    specialty text,
    status text DEFAULT 'upcoming'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cover_image_url text,
    description text,
    fees_info text,
    contact_name text,
    contact_email text,
    contact_phone text
);


--
-- Name: lia_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lia_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lot_id uuid NOT NULL,
    taste_profile_id uuid,
    confidence numeric(3,2) DEFAULT 0.5,
    is_validated boolean,
    validated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: memorized_lots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memorized_lots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lot_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: phone_bid_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_bid_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lot_id uuid NOT NULL,
    phone_number text NOT NULL,
    is_confirmed boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pickup_appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pickup_appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    appointment_date date NOT NULL,
    appointment_time time without time zone NOT NULL,
    status text DEFAULT 'confirmed'::text NOT NULL,
    sale_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text,
    phone text,
    contact_preference public.contact_preference DEFAULT 'email'::public.contact_preference,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    first_name text,
    last_name text,
    company text,
    address text,
    city text,
    postal_code text,
    country text DEFAULT 'France'::text,
    avatar_url text,
    newsletter_subscribed boolean DEFAULT false,
    id_document_url text,
    id_document_uploaded_at timestamp with time zone,
    id_document_status text DEFAULT 'pending'::text,
    bank_validated boolean DEFAULT false,
    bank_validated_at timestamp with time zone,
    stripe_customer_id text,
    CONSTRAINT id_document_status_check CHECK ((id_document_status = ANY (ARRAY['pending'::text, 'uploaded'::text, 'verified'::text, 'rejected'::text])))
);


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lot_id uuid NOT NULL,
    max_bid integer NOT NULL,
    is_confirmed boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: svv_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.svv_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    title text NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date,
    start_time time without time zone,
    end_time time without time zone,
    recurrence_rule text,
    specialty text,
    location text,
    contact_info text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT svv_events_event_type_check CHECK ((event_type = ANY (ARRAY['expertise_slot'::text, 'closure'::text, 'special_expertise'::text])))
);


--
-- Name: taste_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taste_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    profile_name text DEFAULT 'Mon profil'::text NOT NULL,
    styles jsonb DEFAULT '[]'::jsonb,
    ambiances jsonb DEFAULT '[]'::jsonb,
    categories jsonb DEFAULT '[]'::jsonb,
    periods jsonb DEFAULT '[]'::jsonb,
    materials jsonb DEFAULT '[]'::jsonb,
    colors jsonb DEFAULT '[]'::jsonb,
    budget_min integer,
    budget_max integer,
    conversation_history jsonb DEFAULT '[]'::jsonb,
    summary text,
    is_complete boolean DEFAULT false,
    alerts_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action_type public.lot_action_type NOT NULL,
    lot_id uuid,
    sale_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    keyword text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    consent_type text NOT NULL,
    is_accepted boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_interests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_interests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    specialty text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: alert_lot_views alert_lot_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_lot_views
    ADD CONSTRAINT alert_lot_views_pkey PRIMARY KEY (id);


--
-- Name: alert_lot_views alert_lot_views_user_id_lot_id_alert_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_lot_views
    ADD CONSTRAINT alert_lot_views_user_id_lot_id_alert_id_key UNIQUE (user_id, lot_id, alert_id);


--
-- Name: bordereaux bordereaux_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bordereaux
    ADD CONSTRAINT bordereaux_pkey PRIMARY KEY (id);


--
-- Name: info_requests info_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.info_requests
    ADD CONSTRAINT info_requests_pkey PRIMARY KEY (id);


--
-- Name: interencheres_cache interencheres_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interencheres_cache
    ADD CONSTRAINT interencheres_cache_pkey PRIMARY KEY (id);


--
-- Name: interencheres_expositions interencheres_expositions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interencheres_expositions
    ADD CONSTRAINT interencheres_expositions_pkey PRIMARY KEY (id);


--
-- Name: interencheres_lots interencheres_lots_interencheres_lot_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interencheres_lots
    ADD CONSTRAINT interencheres_lots_interencheres_lot_id_key UNIQUE (interencheres_lot_id);


--
-- Name: interencheres_lots interencheres_lots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interencheres_lots
    ADD CONSTRAINT interencheres_lots_pkey PRIMARY KEY (id);


--
-- Name: interencheres_lots interencheres_lots_sale_id_lot_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interencheres_lots
    ADD CONSTRAINT interencheres_lots_sale_id_lot_number_key UNIQUE (sale_id, lot_number);


--
-- Name: interencheres_sales interencheres_sales_interencheres_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interencheres_sales
    ADD CONSTRAINT interencheres_sales_interencheres_id_key UNIQUE (interencheres_id);


--
-- Name: interencheres_sales interencheres_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interencheres_sales
    ADD CONSTRAINT interencheres_sales_pkey PRIMARY KEY (id);


--
-- Name: interencheres_sales interencheres_sales_sale_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interencheres_sales
    ADD CONSTRAINT interencheres_sales_sale_url_key UNIQUE (sale_url);


--
-- Name: lia_suggestions lia_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lia_suggestions
    ADD CONSTRAINT lia_suggestions_pkey PRIMARY KEY (id);


--
-- Name: lia_suggestions lia_suggestions_user_id_lot_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lia_suggestions
    ADD CONSTRAINT lia_suggestions_user_id_lot_id_key UNIQUE (user_id, lot_id);


--
-- Name: memorized_lots memorized_lots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorized_lots
    ADD CONSTRAINT memorized_lots_pkey PRIMARY KEY (id);


--
-- Name: memorized_lots memorized_lots_user_id_lot_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorized_lots
    ADD CONSTRAINT memorized_lots_user_id_lot_id_key UNIQUE (user_id, lot_id);


--
-- Name: phone_bid_requests phone_bid_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_bid_requests
    ADD CONSTRAINT phone_bid_requests_pkey PRIMARY KEY (id);


--
-- Name: pickup_appointments pickup_appointments_appointment_date_appointment_time_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pickup_appointments
    ADD CONSTRAINT pickup_appointments_appointment_date_appointment_time_key UNIQUE (appointment_date, appointment_time);


--
-- Name: pickup_appointments pickup_appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pickup_appointments
    ADD CONSTRAINT pickup_appointments_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: svv_events svv_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.svv_events
    ADD CONSTRAINT svv_events_pkey PRIMARY KEY (id);


--
-- Name: taste_profiles taste_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taste_profiles
    ADD CONSTRAINT taste_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_activity user_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_pkey PRIMARY KEY (id);


--
-- Name: user_alerts user_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_alerts
    ADD CONSTRAINT user_alerts_pkey PRIMARY KEY (id);


--
-- Name: user_alerts user_alerts_user_id_keyword_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_alerts
    ADD CONSTRAINT user_alerts_user_id_keyword_key UNIQUE (user_id, keyword);


--
-- Name: user_consents user_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_pkey PRIMARY KEY (id);


--
-- Name: user_consents user_consents_user_id_consent_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_user_id_consent_type_key UNIQUE (user_id, consent_type);


--
-- Name: user_interests user_interests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_pkey PRIMARY KEY (id);


--
-- Name: user_interests user_interests_user_id_specialty_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_user_id_specialty_key UNIQUE (user_id, specialty);


--
-- Name: idx_alert_lot_views_lot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alert_lot_views_lot_id ON public.alert_lot_views USING btree (lot_id);


--
-- Name: idx_alert_lot_views_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alert_lot_views_user_id ON public.alert_lot_views USING btree (user_id);


--
-- Name: idx_bordereaux_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bordereaux_status ON public.bordereaux USING btree (status);


--
-- Name: idx_bordereaux_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bordereaux_user_id ON public.bordereaux USING btree (user_id);


--
-- Name: idx_interencheres_expositions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interencheres_expositions_date ON public.interencheres_expositions USING btree (exposition_date);


--
-- Name: idx_interencheres_lots_lot_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interencheres_lots_lot_number ON public.interencheres_lots USING btree (lot_number);


--
-- Name: idx_interencheres_lots_sale_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interencheres_lots_sale_id ON public.interencheres_lots USING btree (sale_id);


--
-- Name: idx_interencheres_lots_winner_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interencheres_lots_winner_user_id ON public.interencheres_lots USING btree (winner_user_id);


--
-- Name: idx_interencheres_sales_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interencheres_sales_date ON public.interencheres_sales USING btree (sale_date);


--
-- Name: idx_interencheres_sales_house; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interencheres_sales_house ON public.interencheres_sales USING btree (house_id);


--
-- Name: idx_lots_after_sale; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lots_after_sale ON public.interencheres_lots USING btree (is_after_sale, after_sale_end_date) WHERE (is_after_sale = true);


--
-- Name: idx_svv_events_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_svv_events_dates ON public.svv_events USING btree (start_date, end_date);


--
-- Name: idx_svv_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_svv_events_type ON public.svv_events USING btree (event_type);


--
-- Name: idx_user_activity_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_created_at ON public.user_activity USING btree (created_at DESC);


--
-- Name: idx_user_activity_lot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_lot_id ON public.user_activity USING btree (lot_id);


--
-- Name: idx_user_activity_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_user_id ON public.user_activity USING btree (user_id);


--
-- Name: bordereaux update_bordereaux_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bordereaux_updated_at BEFORE UPDATE ON public.bordereaux FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: info_requests update_info_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_info_requests_updated_at BEFORE UPDATE ON public.info_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: interencheres_expositions update_interencheres_expositions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_interencheres_expositions_updated_at BEFORE UPDATE ON public.interencheres_expositions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: interencheres_lots update_interencheres_lots_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_interencheres_lots_updated_at BEFORE UPDATE ON public.interencheres_lots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: interencheres_sales update_interencheres_sales_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_interencheres_sales_updated_at BEFORE UPDATE ON public.interencheres_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lia_suggestions update_lia_suggestions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lia_suggestions_updated_at BEFORE UPDATE ON public.lia_suggestions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: phone_bid_requests update_phone_bid_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_phone_bid_requests_updated_at BEFORE UPDATE ON public.phone_bid_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pickup_appointments update_pickup_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pickup_appointments_updated_at BEFORE UPDATE ON public.pickup_appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: purchase_orders update_purchase_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: svv_events update_svv_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_svv_events_updated_at BEFORE UPDATE ON public.svv_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: taste_profiles update_taste_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_taste_profiles_updated_at BEFORE UPDATE ON public.taste_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_alerts update_user_alerts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_alerts_updated_at BEFORE UPDATE ON public.user_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: alert_lot_views alert_lot_views_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_lot_views
    ADD CONSTRAINT alert_lot_views_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.user_alerts(id) ON DELETE CASCADE;


--
-- Name: alert_lot_views alert_lot_views_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_lot_views
    ADD CONSTRAINT alert_lot_views_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.interencheres_lots(id) ON DELETE CASCADE;


--
-- Name: bordereaux bordereaux_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bordereaux
    ADD CONSTRAINT bordereaux_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.interencheres_lots(id) ON DELETE SET NULL;


--
-- Name: bordereaux bordereaux_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bordereaux
    ADD CONSTRAINT bordereaux_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.interencheres_sales(id) ON DELETE SET NULL;


--
-- Name: info_requests info_requests_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.info_requests
    ADD CONSTRAINT info_requests_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.interencheres_lots(id) ON DELETE CASCADE;


--
-- Name: interencheres_expositions interencheres_expositions_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interencheres_expositions
    ADD CONSTRAINT interencheres_expositions_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.interencheres_sales(id) ON DELETE CASCADE;


--
-- Name: interencheres_lots interencheres_lots_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interencheres_lots
    ADD CONSTRAINT interencheres_lots_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.interencheres_sales(id) ON DELETE CASCADE;


--
-- Name: interencheres_lots interencheres_lots_winner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interencheres_lots
    ADD CONSTRAINT interencheres_lots_winner_user_id_fkey FOREIGN KEY (winner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: lia_suggestions lia_suggestions_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lia_suggestions
    ADD CONSTRAINT lia_suggestions_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.interencheres_lots(id) ON DELETE CASCADE;


--
-- Name: lia_suggestions lia_suggestions_taste_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lia_suggestions
    ADD CONSTRAINT lia_suggestions_taste_profile_id_fkey FOREIGN KEY (taste_profile_id) REFERENCES public.taste_profiles(id) ON DELETE CASCADE;


--
-- Name: memorized_lots memorized_lots_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorized_lots
    ADD CONSTRAINT memorized_lots_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.interencheres_lots(id) ON DELETE CASCADE;


--
-- Name: phone_bid_requests phone_bid_requests_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_bid_requests
    ADD CONSTRAINT phone_bid_requests_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.interencheres_lots(id) ON DELETE CASCADE;


--
-- Name: pickup_appointments pickup_appointments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pickup_appointments
    ADD CONSTRAINT pickup_appointments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.interencheres_sales(id) ON DELETE SET NULL;


--
-- Name: purchase_orders purchase_orders_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.interencheres_lots(id) ON DELETE CASCADE;


--
-- Name: user_activity user_activity_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.interencheres_lots(id) ON DELETE SET NULL;


--
-- Name: user_activity user_activity_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.interencheres_sales(id) ON DELETE SET NULL;


--
-- Name: pickup_appointments Anyone can check slot availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can check slot availability" ON public.pickup_appointments FOR SELECT USING (true);


--
-- Name: interencheres_cache Public read access for interencheres_cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access for interencheres_cache" ON public.interencheres_cache FOR SELECT USING (true);


--
-- Name: interencheres_expositions Public read access for interencheres_expositions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access for interencheres_expositions" ON public.interencheres_expositions FOR SELECT USING (true);


--
-- Name: interencheres_lots Public read access for interencheres_lots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access for interencheres_lots" ON public.interencheres_lots FOR SELECT USING (true);


--
-- Name: interencheres_sales Public read access for interencheres_sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access for interencheres_sales" ON public.interencheres_sales FOR SELECT USING (true);


--
-- Name: svv_events Public read access for svv_events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access for svv_events" ON public.svv_events FOR SELECT USING (true);


--
-- Name: bordereaux Service role full access for bordereaux; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access for bordereaux" ON public.bordereaux USING (true) WITH CHECK (true);


--
-- Name: interencheres_cache Service role write for interencheres_cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role write for interencheres_cache" ON public.interencheres_cache USING (true) WITH CHECK (true);


--
-- Name: interencheres_expositions Service role write for interencheres_expositions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role write for interencheres_expositions" ON public.interencheres_expositions USING (true) WITH CHECK (true);


--
-- Name: interencheres_lots Service role write for interencheres_lots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role write for interencheres_lots" ON public.interencheres_lots USING (true) WITH CHECK (true);


--
-- Name: interencheres_sales Service role write for interencheres_sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role write for interencheres_sales" ON public.interencheres_sales USING (true) WITH CHECK (true);


--
-- Name: svv_events Service role write for svv_events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role write for svv_events" ON public.svv_events USING (true) WITH CHECK (true);


--
-- Name: user_activity Users can create their own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own activity" ON public.user_activity FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: alert_lot_views Users can create their own alert lot views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own alert lot views" ON public.alert_lot_views FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_alerts Users can create their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own alerts" ON public.user_alerts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: pickup_appointments Users can create their own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own appointments" ON public.pickup_appointments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_consents Users can create their own consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own consents" ON public.user_consents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: info_requests Users can create their own info requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own info requests" ON public.info_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_interests Users can create their own interests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own interests" ON public.user_interests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: memorized_lots Users can create their own memorized lots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own memorized lots" ON public.memorized_lots FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: phone_bid_requests Users can create their own phone bid requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own phone bid requests" ON public.phone_bid_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: purchase_orders Users can create their own purchase orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own purchase orders" ON public.purchase_orders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: taste_profiles Users can create their own taste profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own taste profiles" ON public.taste_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: lia_suggestions Users can delete their own Lia suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own Lia suggestions" ON public.lia_suggestions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: alert_lot_views Users can delete their own alert lot views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own alert lot views" ON public.alert_lot_views FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_alerts Users can delete their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own alerts" ON public.user_alerts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: pickup_appointments Users can delete their own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own appointments" ON public.pickup_appointments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_interests Users can delete their own interests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own interests" ON public.user_interests FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: memorized_lots Users can delete their own memorized lots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own memorized lots" ON public.memorized_lots FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: phone_bid_requests Users can delete their own phone bid requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own phone bid requests" ON public.phone_bid_requests FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: purchase_orders Users can delete their own purchase orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own purchase orders" ON public.purchase_orders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: taste_profiles Users can delete their own taste profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own taste profiles" ON public.taste_profiles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: lia_suggestions Users can insert their own Lia suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own Lia suggestions" ON public.lia_suggestions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: lia_suggestions Users can update their own Lia suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own Lia suggestions" ON public.lia_suggestions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_alerts Users can update their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own alerts" ON public.user_alerts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: pickup_appointments Users can update their own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own appointments" ON public.pickup_appointments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: bordereaux Users can update their own bordereaux; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own bordereaux" ON public.bordereaux FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_consents Users can update their own consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own consents" ON public.user_consents FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: info_requests Users can update their own info requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own info requests" ON public.info_requests FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: phone_bid_requests Users can update their own phone bid requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own phone bid requests" ON public.phone_bid_requests FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: purchase_orders Users can update their own purchase orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own purchase orders" ON public.purchase_orders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: taste_profiles Users can update their own taste profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own taste profiles" ON public.taste_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: lia_suggestions Users can view their own Lia suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own Lia suggestions" ON public.lia_suggestions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_activity Users can view their own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own activity" ON public.user_activity FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: alert_lot_views Users can view their own alert lot views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own alert lot views" ON public.alert_lot_views FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_alerts Users can view their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own alerts" ON public.user_alerts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: pickup_appointments Users can view their own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own appointments" ON public.pickup_appointments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: bordereaux Users can view their own bordereaux; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own bordereaux" ON public.bordereaux FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_consents Users can view their own consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own consents" ON public.user_consents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: info_requests Users can view their own info requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own info requests" ON public.info_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_interests Users can view their own interests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own interests" ON public.user_interests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: memorized_lots Users can view their own memorized lots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own memorized lots" ON public.memorized_lots FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: phone_bid_requests Users can view their own phone bid requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own phone bid requests" ON public.phone_bid_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: purchase_orders Users can view their own purchase orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own purchase orders" ON public.purchase_orders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: taste_profiles Users can view their own taste profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own taste profiles" ON public.taste_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: alert_lot_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alert_lot_views ENABLE ROW LEVEL SECURITY;

--
-- Name: bordereaux; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bordereaux ENABLE ROW LEVEL SECURITY;

--
-- Name: info_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.info_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: interencheres_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interencheres_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: interencheres_expositions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interencheres_expositions ENABLE ROW LEVEL SECURITY;

--
-- Name: interencheres_lots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interencheres_lots ENABLE ROW LEVEL SECURITY;

--
-- Name: interencheres_sales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interencheres_sales ENABLE ROW LEVEL SECURITY;

--
-- Name: lia_suggestions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lia_suggestions ENABLE ROW LEVEL SECURITY;

--
-- Name: memorized_lots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.memorized_lots ENABLE ROW LEVEL SECURITY;

--
-- Name: phone_bid_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.phone_bid_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: pickup_appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pickup_appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: svv_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.svv_events ENABLE ROW LEVEL SECURITY;

--
-- Name: taste_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.taste_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: user_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: user_consents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

--
-- Name: user_interests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;