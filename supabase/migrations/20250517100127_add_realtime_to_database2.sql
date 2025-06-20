

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."drawings" (
    "id" bigint NOT NULL,
    "drawing_id" "uuid" DEFAULT "gen_random_uuid"(),
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "ai_message" "text",
    "drawing_url" "text"
);


ALTER TABLE "public"."drawings" OWNER TO "postgres";


ALTER TABLE "public"."drawings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."drawings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "drawing_id" "uuid",
    "song_id" "uuid"
);


ALTER TABLE "public"."recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."songs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_track_data" "jsonb",
    "last_updated" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."songs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."drawings"
    ADD CONSTRAINT "drawings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recommendations"
    ADD CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."songs"
    ADD CONSTRAINT "songs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drawings"
    ADD CONSTRAINT "drawings_drawing_id_fkey" FOREIGN KEY ("drawing_id") REFERENCES "storage"."objects"("id");



ALTER TABLE ONLY "public"."recommendations"
    ADD CONSTRAINT "recommendations_drawing_id_fkey" FOREIGN KEY ("drawing_id") REFERENCES "storage"."objects"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recommendations"
    ADD CONSTRAINT "recommendations_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id");





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."recommendations";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
































































































































































































GRANT ALL ON TABLE "public"."drawings" TO "anon";
GRANT ALL ON TABLE "public"."drawings" TO "authenticated";
GRANT ALL ON TABLE "public"."drawings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."drawings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."drawings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."drawings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."recommendations" TO "anon";
GRANT ALL ON TABLE "public"."recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."songs" TO "anon";
GRANT ALL ON TABLE "public"."songs" TO "authenticated";
GRANT ALL ON TABLE "public"."songs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

--
-- Dumped schema changes for auth and storage
--

