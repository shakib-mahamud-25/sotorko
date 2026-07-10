# 04-Technical-Architecture.md

# Sotorko

## Technical Architecture (MVP)

**Version:** 1.0
**Purpose:** Define the technology stack, project structure, backend architecture, security model, deployment strategy, and engineering standards for building a scalable, privacy-first community safety platform.

---

# 1. Architecture Principles

The platform should be designed with the following priorities:

* Mobile-first
* Privacy-first
* Anonymous by default
* Fast and lightweight
* Scalable
* Secure
* Maintainable
* Cost-efficient
* AI-friendly codebase
* Production-ready architecture

The MVP should support thousands of reports without requiring major architectural changes.

---

# 2. Technology Stack

## Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod
* TanStack Query

---

## Maps

* MapLibre GL JS
* OpenStreetMap Tiles

Future support:

* Google Maps
* Mapbox

---

## Backend

Supabase

Services:

* PostgreSQL
* PostGIS
* Authentication (Admin only)
* Storage
* Edge Functions
* Realtime

---

## Database

PostgreSQL + PostGIS

Reason:

Efficient geographic queries including:

* Radius search
* Heatmaps
* Clustering
* Distance calculation
* Spatial indexing

---

## File Storage

Supabase Storage

or

Cloudinary

Requirements:

* Image compression
* EXIF removal
* Private buckets
* Secure URLs

---

# 3. Project Structure

```text
/app
    /(public)
    /(admin)
    /report
    /incident
    /about
    /privacy

/components
    map/
    report/
    ui/
    analytics/
    filters/
    layout/

/hooks

/lib
    api/
    map/
    utils/
    validation/

/services

/types

/styles

/public

/docs
```

Feature-based organization should be preferred over large monolithic files.

---

# 4. Core Modules

## Public Map

Responsibilities:

* Search
* Map rendering
* Heatmap
* Pins
* Safety Score
* Filters

---

## Reporting

Responsibilities:

* Anonymous submission
* Validation
* Image upload
* Location processing
* Edit Code generation

---

## Analytics

Responsibilities:

* Statistics
* Trends
* Safety Score calculation
* Heatmap generation

---

## Moderation

Responsibilities:

* Flagged reports
* Approvals
* Archive
* Remove
* Merge duplicates

---

# 5. API Design

Example endpoints:

```text
GET    /api/reports

GET    /api/report/{id}

POST   /api/report

PUT    /api/report/{code}

DELETE /api/report/{code}

POST   /api/report/{id}/confirm

GET    /api/safety-score

GET    /api/statistics

GET    /api/categories

GET    /api/heatmap
```

All endpoints should return consistent JSON responses and proper HTTP status codes.

---

# 6. Security

The platform prioritizes privacy over user identification.

Requirements:

* HTTPS everywhere
* Input validation
* SQL injection protection
* XSS prevention
* CSRF protection
* Secure file uploads
* Rate limiting
* Security headers
* Environment variables
* Server-side validation

---

# 7. Anonymous Reporting Model

Users are **not required** to create accounts.

Instead:

* Generate a unique edit/delete code after submission.
* Store only a hashed version of the code.
* Display the original code once.
* Require the code for future edits or deletion.

This preserves anonymity while allowing limited ownership of reports.

---

# 8. Abuse Prevention

Multiple signals should determine report trust.

Signals include:

* Browser fingerprint (privacy-conscious)
* Rate limiting
* Submission frequency
* Duplicate descriptions
* Similar nearby reports
* Repeated browser behavior
* VPN/proxy detection (supporting signal only)
* Spam heuristics

Flagged reports enter moderation rather than being automatically rejected.

---

# 9. Location Processing

Workflow:

1. User grants location permission or manually selects a point.
2. Exact coordinates are stored securely.
3. Public coordinates are generated using a randomized 5–15 meter offset.
4. Map displays only the public coordinates.

This balances usefulness with privacy.

---

# 10. Safety Score Engine

Safety Score is recalculated whenever relevant data changes.

Inputs:

* Incident count
* Severity
* Community confirmations
* Geographic density
* Time decay
* Trust score

The algorithm should be modular so it can be refined without changing the database structure.

---

# 11. Image Handling

Uploaded images should:

* Remove EXIF metadata
* Compress automatically
* Validate file type and size
* Remain private
* Be accessible only to moderators

Public image galleries are intentionally excluded from the MVP.

---

# 12. Performance

Target metrics:

* Initial page load under 2 seconds on broadband
* Smooth map interaction
* Lazy-loaded components
* Optimized images
* Server-side rendering where appropriate
* Code splitting
* Incremental loading for map data

The application should remain usable on slower mobile networks.

---

# 13. Deployment

Frontend:

* Vercel

Backend:

* Supabase

Storage:

* Supabase Storage

Version Control:

* GitHub

Continuous Deployment:

* Automatic deployment from the `main` branch after passing quality checks.

---

# 14. Development Standards

Code should be:

* Modular
* Typed
* Reusable
* Well-documented
* Consistently formatted

Use:

* ESLint
* Prettier
* Husky (optional)
* Conventional commit messages

Components should remain small and focused on a single responsibility.

---

# 15. Scalability Roadmap

The architecture should support future additions without major rewrites.

Planned expansions include:

* Progressive Web App (PWA)
* Native mobile applications
* Push notifications
* Safe route recommendations
* SOS features
* Verified NGO and authority dashboards
* Research data exports
* Nationwide coverage
* AI-assisted moderation
* Multilingual expansion beyond Bangla and English

---

# 16. Engineering Principles

All engineering decisions should follow these principles:

1. Privacy before convenience.
2. Simplicity before complexity.
3. Secure by default.
4. Anonymous by design.
5. Performance is a feature.
6. Accessibility is mandatory.
7. Build reusable components.
8. Optimize for long-term maintainability.
9. Prefer open-source technologies where practical.
10. Every technical decision should reinforce Sotorko's mission of providing reliable, community-driven safety intelligence for women in Bangladesh.

---

# Final Architecture Summary

Sotorko will be built as a modern, full-stack web application using **Next.js**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase**, **PostgreSQL/PostGIS**, and **MapLibre GL**. The architecture emphasizes privacy, scalability, performance, and maintainability while enabling anonymous reporting, dynamic Safety Scores, geographic analytics, and efficient moderation. The MVP is intentionally lightweight but designed to evolve into a nationwide civic technology platform without requiring fundamental architectural changes.
