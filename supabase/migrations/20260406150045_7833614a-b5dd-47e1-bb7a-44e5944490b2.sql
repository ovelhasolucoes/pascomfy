
-- Add scope column to event_checklist_items
ALTER TABLE public.event_checklist_items 
ADD COLUMN scope text NOT NULL DEFAULT 'shared' 
CHECK (scope IN ('individual', 'shared'));

-- RLS policy: any member scaled in the event can INSERT progress for shared items
CREATE POLICY "Scaled member inserts shared progress"
ON public.event_checklist_progress
FOR INSERT
TO authenticated
WITH CHECK (
  (company_id = get_user_company_id(auth.uid()))
  AND EXISTS (
    SELECT 1 
    FROM event_checklist_items eci
    JOIN event_checklists ec ON ec.id = eci.event_checklist_id
    JOIN event_teams et ON et.event_id = ec.event_id
    JOIN event_team_members etm ON etm.event_team_id = et.id
    WHERE eci.id = event_checklist_item_id
      AND eci.scope = 'shared'
      AND etm.user_id = auth.uid()
  )
);

-- RLS policy: any member scaled in the event can UPDATE progress for shared items
CREATE POLICY "Scaled member updates shared progress"
ON public.event_checklist_progress
FOR UPDATE
TO authenticated
USING (
  (company_id = get_user_company_id(auth.uid()))
  AND EXISTS (
    SELECT 1 
    FROM event_checklist_items eci
    JOIN event_checklists ec ON ec.id = eci.event_checklist_id
    JOIN event_teams et ON et.event_id = ec.event_id
    JOIN event_team_members etm ON etm.event_team_id = et.id
    WHERE eci.id = event_checklist_item_id
      AND eci.scope = 'shared'
      AND etm.user_id = auth.uid()
  )
)
WITH CHECK (
  (company_id = get_user_company_id(auth.uid()))
  AND EXISTS (
    SELECT 1 
    FROM event_checklist_items eci
    JOIN event_checklists ec ON ec.id = eci.event_checklist_id
    JOIN event_teams et ON et.event_id = ec.event_id
    JOIN event_team_members etm ON etm.event_team_id = et.id
    WHERE eci.id = event_checklist_item_id
      AND eci.scope = 'shared'
      AND etm.user_id = auth.uid()
  )
);

-- Index for scope queries
CREATE INDEX idx_event_checklist_items_scope ON public.event_checklist_items(scope);
