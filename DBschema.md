# Data schema

## Template
- `id` (string, hash-safe)
- `title` (text)
- `role_catalog` (array of role labels)
- `sections` (array of Section)
- `imported_at` (datetime)

### Section
- `section_id` (string)
- `title` (text)
- `activities` (array of Activity)

### Activity
- `activity_id` (string)
- `activity` (text)
- `description` (text)
- `recommended_raci` (object with keys R/A/C/I -> array of roles)
- `guidance` (string array)
- `signals` (string array)

## TemplateMapping
- `template_id` (string FK -> Template.id)
- `mapping` (object { section, activity, description, recommended })
- `source` (original filename)

## Workshop
- `id` (uuid)
- `name` (text)
- `org` (text)
- `sponsor` (text)
- `template_id` (FK -> Template.id)
- `scope` (array of section titles)
- `mode` (`executive` | `full`)
- `attendees` (array of {name, title})
- `role_map` (object templateRole -> attendeeRole)
- `status` (`draft` | `in_progress` | `finalized`)
- `created_at` / `updated_at` / `finalized_at`

## WorkshopSection
- Derived from Template sections filtered by workshop scope; stored as part of Workshop for quick loading.

## ActivityResult
- `activity_id` (string)
- `section_id` (string)
- `accountable_role` (string|null)
- `responsible_roles` (array)
- `consulted_roles` (array)
- `informed_roles` (array)
- `confidence` (`high`|`med`|`low`)
- `status` (`confirmed`|`followup`|`parked`)
- `notes` (text)
- `gaps` (array of Gap)
- `completeness` (0-100)
- `updated_at`

## Gap
- `severity` (`critical`|`high`|`medium`|`low`)
- `category` (ownership|responsible|evidence|progress)
- `message` (text)

## ActionItem
- `id` (uuid)
- `title` (text)
- `owner` (text)
- `due_date` (date string)
- `severity` (critical|high|medium|low)
- `status` (open|in_progress|done)

## Decision
- `id` (uuid)
- `activity_id` (string)
- `decision_text` (text)
- `rationale` (text)

## ExportArtifact (metadata)
- `workshop_id`
- `kind` (json|excel|pptx|pdf)
- `generated_at`
- `source` (static|backend)
