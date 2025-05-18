create trigger "handle_upload_webhook" after insert
on "storage"."objects" for each row
execute function "supabase_functions"."http_request"(
  'http://host.docker.internal:54321/functions/v1/handle-upload',
  'POST',
  '{"Content-Type":"application/json", "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"}',
  '{}',
  '1000'
);