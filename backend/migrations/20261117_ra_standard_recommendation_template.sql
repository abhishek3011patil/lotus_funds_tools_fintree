-- Apply the new RA default message layout to previously saved generic new-call templates.
-- Named group templates and broker templates remain as configured.
UPDATE ra_message_templates
SET template_data = template_data || '{"standardLayout": true}'::jsonb,
    updated_at = NOW()
WHERE message_type = 'NEW_CALL';
