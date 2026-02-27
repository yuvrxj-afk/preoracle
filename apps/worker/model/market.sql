-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.market_outcomes (
  id integer NOT NULL DEFAULT nextval('market_outcomes_id_seq'::regclass),
  market_id text,
  outcome_index integer NOT NULL,
  outcome_name text NOT NULL,
  CONSTRAINT market_outcomes_pkey PRIMARY KEY (id),
  CONSTRAINT market_outcomes_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id)
);

CREATE TABLE public.market_state (
  market_id text NOT NULL,
  liquidity numeric,
  volume numeric,
  volume_24hr numeric,
  last_trade_price numeric,
  best_bid numeric,
  best_ask numeric,
  spread numeric,
  price_change_1h numeric,
  price_change_1d numeric,
  price_change_1w numeric,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT market_state_pkey PRIMARY KEY (market_id),
  CONSTRAINT market_state_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id)
);

CREATE TABLE public.markets (
  id text NOT NULL,
  question text NOT NULL,
  slug text,
  description text,
  category text,
  condition_id text,
  market_type text,
  image text,
  icon text,
  resolution_source text,
  market_maker_address text,
  active boolean NOT NULL,
  closed boolean NOT NULL,
  archived boolean NOT NULL,
  approved boolean NOT NULL,
  funded boolean NOT NULL,
  restricted boolean NOT NULL,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  end_date timestamp without time zone,
  closed_time timestamp without time zone,
  CONSTRAINT markets_pkey PRIMARY KEY (id)
);

CREATE TABLE public.price_snapshots (
  id integer NOT NULL DEFAULT nextval('price_snapshots_id_seq'::regclass),
  market_id text,
  outcome_index integer NOT NULL,
  price numeric NOT NULL,
  recorded_at timestamp without time zone DEFAULT now(),
  CONSTRAINT price_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT price_snapshots_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id)
);