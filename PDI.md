# OT RACI Workshop App – PDI

## 1. Product Summary

The OT RACI Workshop App is a self-hosted web application that transforms a structured OT RACI Excel template into an interactive, workshop-ready tool for CIOs, CISOs, OT leadership, and plant operations. It guides stakeholders through clarifying who is Responsible, Accountable, Consulted, and Informed for key OT cyber and operational activities, automatically detecting gaps and misalignments and generating action-ready outputs.

## 2. Problem Statement

Organizations operating OT environments struggle with:

- Ambiguous ownership for OT cyber and operational controls.
- Overlap and conflict between IT, OT, vendors, and compliance teams.
- Difficulty translating frameworks and policies into clear decision rights.
- Workshops that generate slides but not structured, reusable data.

We need a tool that turns an OT RACI template into a guided workshop experience and persistent governance artifact.

## 3. Primary Users & Personas

1. **CIO / CISO / OT Executive**
   - Needs: Clear accountability, confidence that OT risk is owned and managed.
   - Uses app during workshops to agree on RACI, then review gap & action reports.

2. **OT Engineering / Plant Ops Leader**
   - Needs: Clarity on what their team is responsible for vs IT and vendors.
   - Uses app to negotiate realistic responsibilities and identify overload.

3. **Risk / Compliance / GRC Leader**
   - Needs: Mapped accountability to controls, frameworks, and policies.
   - Uses app output to feed into IRM/ServiceNow and assurance planning.

4. **Consultant / Facilitator (you)**
   - Needs: Repeatable, structured workshop method with strong visuals and exports.
   - Uses app end-to-end for preparation, facilitation, and follow-up.

## 4. Goals and Non-Goals

### Goals

- Ingest the OT RACI Excel template and map roles, activities, and recommended RACI.
- Support live workshops to capture and finalize RACI decisions per activity and role.
- Validate RACI structure (exactly one A, at least one R).
- Highlight gaps and conflicts, including deviations from recommended RACI.
- Generate exportable artifacts: RACI matrix, gap reports, and action plans.
- Run fully self-hosted (e.g., in a Docker container) with no dependency on external SaaS.

### Non-Goals

- Real-time multi-tenant SaaS platform (initially this is single-tenant/self-hosted).
- Full HR/role lifecycle management.
- Direct integration with ServiceNow in v1 (export files will support integration in later phases).

## 5. Success Metrics

- Workshop completion rate: ≥ 80% of in-scope activities have fully valid RACI by session end.
- Gap detection: 100% of activities with missing or conflicting RACI flagged.
- Executive satisfaction: ≥ 4/5 rating on “clarity of accountability” in post-workshop feedback.
- Adoption: App reused for at least 2+ follow-up workshops per customer.

## 6. Key Features

1. **RACI Template Import**
   - Upload Excel file.
   - Map sheets and columns to app fields.
   - Persist activities, domains, roles, and optional recommended RACI.

2. **Engagement/Workshop Setup**
   - Create named workshops linked to a specific customer/org.
   - Select which domains and activities are in scope.
   - Assign workshop participants to roles.

3. **Perception Check Mode**
   - Rapid capture of “who is accountable today?” for key activities.
   - Optional comparison against recommended RACI.

4. **Domain-based RACI Editor**
   - Tabbed or filterable view by domain.
   - Activity rows with RACI assignment controls.
   - Recommended vs. Workshop RACI comparison.
   - Validation rules (exactly one A, at least one R).

5. **Gap & Conflict Analytics**
   - Automatic detection of:
     - Missing A / multiple A.
     - No R.
     - Role overload (configurable thresholds).
     - Deviation from recommended RACI.

6. **Role Load and Summary Views**
   - Per-role breakdown of R/A/C/I counts.
   - Visual indicators of overload and misalignment.

7. **Action Plan Builder**
   - Convert flagged issues into structured actions with owners and due dates.
   - Allow adding custom actions.

8. **Export & Reporting**
   - Export full RACI matrix (CSV, Excel).
   - Export gap list and action plan.
   - Generate PDF summary pack.

9. **Self-hosting & Security**
   - Containerized deployment (Docker).
   - Local database (e.g., SQLite/PostgreSQL).
   - Basic authentication for workshop participants.
   - Data stored on customer-controlled infrastructure.

## 7. Data Model (Logical)

### Core Entities

- **Organization**
  - id
  - name
  - industry
  - notes

- **Workshop**
  - id
  - organization_id (FK)
  - name
  - date
  - description
  - status (planned / in-progress / completed)

- **Domain**
  - id
  - organization_id (FK) or global
  - name
  - description

- **Role**
  - id
  - organization_id (FK)
  - name (e.g., CIO, CISO, OT Engineering Manager)
  - category (IT, OT, Vendor, Compliance, Other)
  - description

- **Activity**
  - id
  - domain_id (FK)
  - code / reference_id (from template)
  - name
  - description
  - criticality (e.g., High/Medium/Low)
  - framework_refs (e.g., NIST CSF, IEC 62443, CIP mappings)

- **RecommendedRACI**
  - id
  - activity_id (FK)
  - role_id (FK)
  - value (R/A/C/I or None)

- **WorkshopRACI**
  - id
  - workshop_id (FK)
  - activity_id (FK)
  - role_id (FK)
  - value (R/A/C/I or None)

- **Issue (Gap/Conflict)**
  - id
  - workshop_id (FK)
  - activity_id (FK)
  - role_id (FK, nullable)
  - type (missing_A, multiple_A, no_R, deviation_from_recommended, role_overload)
  - severity (High/Medium/Low)
  - notes

- **ActionItem**
  - id
  - workshop_id (FK)
  - issue_id (FK, nullable)
  - summary
  - owner_role_id (FK)
  - owner_name (optional)
  - due_date
  - status (planned, in-progress, completed)
  - priority

## 8. User Flows (High-Level)

1. **Facilitator – Setup Flow**
   1. Log in.
   2. Create Organization (if new).
   3. Create Workshop.
   4. Upload RACI Template and map columns.
   5. Confirm imported domains, roles, and activities.
   6. Select scope (domains/activities) for this workshop.

2. **Workshop – Perception Check Flow**
   1. Open Workshop Overview page on big screen.
   2. Start Perception Check mode.
   3. For each key activity, select current accountable role.
   4. Optionally reveal recommended vs current.
   5. Save perception snapshot.

3. **Workshop – RACI Editing Flow**
   1. Choose domain and view activity list.
   2. For each activity:
      - Review description and context.
      - Assign A, then R, C, I.
   3. Resolve validation errors per activity.
   4. Mark domain as complete.

4. **Workshop – Gap & Action Flow**
   1. Go to Gap Report.
   2. Filter by gap type.
   3. For each issue, decide:
      - Change RACI immediately.
      - Or log an action.
   4. Build / refine action plan.
   5. Export outputs.

## 9. Risks & Mitigations

- **Risk:** Excel templates differ slightly between customers.
  - **Mitigation:** Flexible column mapping UI; clearly documented requirements.

- **Risk:** Workshop runs out of time before all activities are covered.
  - **Mitigation:** Allow partial completion; domain prioritization; quick “minimal viable RACI” mode for key activities.

- **Risk:** Overly complex UI for executives.
  - **Mitigation:** Clean, domain-based navigation; facilitator-centric controls; hide advanced options during workshop.

## 10. Roadmap (Future)

- Integrate with ServiceNow GRC/IRM via API (create roles, controls, ownership).
- Add per-person rather than per-role accountability (for operationalization).
- Add versioning and comparison between workshop iterations.
