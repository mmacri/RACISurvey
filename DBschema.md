# Database Schema

## Template
- `id` (uuid, pk)
- `name` (text)
- `source_filename` (text)
- `imported_at` (datetime)
- `sections` (json array of section names)
- `roles` (json array)
- `activities` (json array of objects: id, section, sheet, text)

## Workshop
- `id` (uuid, pk)
- `name` (text)
- `org` (text)
- `sponsor` (text)
- `created_at` / `updated_at` (datetime)
- `template_id` (fk Template.id)
- `scope` (json array of section names)
- `mode` (executive|full)
- `attendees` (json array of objects)
- `role_map` (json key/value)
- `status` (draft|finalized)
- `finalized_at` (datetime nullable)

## ActivityResponse
- `id` (uuid, pk)
- `workshop_id` (fk Workshop.id)
- `section_name` (text)
- `activity_id` (text)
- `accountable_role` (text nullable)
- `responsible_roles` (json array)
- `consulted_roles` (json array)
- `informed_roles` (json array)
- `confidence` (low|med|high)
- `status` (proposed|confirmed|followup)
- `notes` (text)
- `last_updated` (datetime)

## Decision
- `id` (uuid, pk)
- `workshop_id` (fk Workshop.id)
- `section_name` (text)
- `activity_id` (text)
- `decision_text` (text)
- `rationale` (text)
- `decided_by` (text)
- `timestamp` (datetime)

## ActionItem
- `id` (uuid, pk)
- `workshop_id` (fk Workshop.id)
- `severity` (critical|high|medium|low)
- `title` (text)
- `description` (text)
- `owner` (text)
- `due_date` (text)
- `status` (open|in_progress|done)
- `related_activity_id` (text nullable)

## Gap (computed view)
- Not stored; derived from ActivityResponse using gap engine (missing A, multiple A, missing R, too many R, A=R flag, low confidence, follow-up).
