-- Étape 1 : Mettre à jour la contrainte CHECK pour accepter user_signup
ALTER TABLE email_notification_queue 
DROP CONSTRAINT IF EXISTS email_notification_queue_event_type_check;

ALTER TABLE email_notification_queue 
ADD CONSTRAINT email_notification_queue_event_type_check 
CHECK (event_type = ANY (ARRAY[
  'task_assigned'::text, 
  'project_assigned'::text, 
  'role_changed'::text, 
  'portfolio_review'::text,
  'user_signup'::text
]));

-- Étape 2 : Modifier la fonction handle_new_user pour ajouter les notifications email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
    notification_id UUID;
    target_id UUID;
    admin_user RECORD;
BEGIN
    -- Insert into profiles (existing functionality)
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
  
    -- Assign default role (existing functionality)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
        NEW.id,
        CASE 
            WHEN NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN 'admin'::user_role
            ELSE 'chef_projet'::user_role
        END
    );

    -- Assign le role de membre systématiquement
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
        NEW.id,
        'membre'::user_role
    );

    -- NOUVEAU : Insérer une notification email pour chaque admin
    FOR admin_user IN 
        SELECT ur.user_id 
        FROM user_roles ur 
        WHERE ur.role = 'admin'
    LOOP
        INSERT INTO email_notification_queue (user_id, event_type, event_data)
        VALUES (
            admin_user.user_id,
            'user_signup',
            jsonb_build_object(
                'new_user_email', NEW.email,
                'new_user_first_name', NEW.raw_user_meta_data->>'first_name',
                'new_user_last_name', NEW.raw_user_meta_data->>'last_name',
                'new_user_id', NEW.id,
                'signup_date', CURRENT_TIMESTAMP
            )
        );
    END LOOP;

    -- Create notification for admins (existing in-app notification)
    INSERT INTO public.notifications (
        title,
        content,
        type,
        publication_date,
        published
    )
    VALUES (
        'Nouvel utilisateur inscrit',
        format('L''utilisateur %s vient de s''inscrire sur la plateforme.', NEW.email),
        'system',
        CURRENT_TIMESTAMP,
        true
    )
    RETURNING id INTO notification_id;

    -- Create notification target for admins
    INSERT INTO public.notification_targets (
        notification_id,
        target_type
    )
    VALUES (
        notification_id,
        'specific'
    )
    RETURNING id INTO target_id;

    -- Create notification target users for all admins
    INSERT INTO public.notification_target_users (
        notification_target_id,
        user_id
    )
    SELECT 
        target_id,
        ur.user_id
    FROM user_roles ur
    WHERE ur.role = 'admin';

    -- Create user_notifications entries for all admins
    INSERT INTO public.user_notifications (
        notification_id,
        user_id
    )
    SELECT 
        notification_id,
        ur.user_id
    FROM user_roles ur
    WHERE ur.role = 'admin';
  
    RETURN NEW;
END;
$function$;