-- Switch saved generic RA errata templates to the current RA message format.
-- Named templates and broker templates keep their chosen layouts.
UPDATE ra_message_templates
SET template_data = template_data || '{"standardLayout": true}'::jsonb,
    updated_at = NOW()
WHERE message_type = 'ERRATA';
