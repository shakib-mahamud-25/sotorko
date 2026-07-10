# 02-Architecture.md

# Sotorko

## Information Architecture & Database Overview (MVP)

**Version:** 1.0
**Purpose:** Define the application's structure, navigation, user flows, database entities, and moderation workflow.

---

# 1. Information Architecture

```
Sotorko
│
├── Home
│   ├── Interactive Map
│   ├── Search
│   ├── Safety Score
│   ├── Heatmap Toggle
│   ├── Incident Filters
│   ├── Statistics
│   └── Recent Reports
│
├── Report Incident
│
├── Incident Details
│
├── Edit/Delete Report
│
├── About
│
├── Privacy Policy
│
├── Terms of Use
│
└── Admin Dashboard
    ├── Flagged Reports
    ├── Moderation Queue
    ├── Analytics
    └── Incident Management
```

---

# 2. Primary User Flow

## Check an Area

```
Open Website

↓

Search Area

↓

Map Zooms

↓

Safety Score

↓

Recent Incidents

↓

Heatmap

↓

Travel Decision
```

---

## Submit a Report

```
Report Incident

↓

Choose Location

↓

Select Category

↓

Choose Severity

↓

Date & Time

↓

Description (Optional)

↓

Upload Photos (Optional)

↓

Submit

↓

Receive Unique Report Code
```

---

## Community Confirmation

```
Open Incident

↓

"I Experienced Something Similar"

↓

Confirmation Count Increases

↓

Safety Score Updates
```

---

# 3. Navigation Principles

The platform is built around one primary action:

> **Check whether an area is safe.**

Therefore:

* The map is always visible.
* Search is the primary interface.
* Reporting is secondary.
* Navigation should never require more than two clicks for core actions.
* Anonymous usage is the default.

---

# 4. Core Database Entities

## Reports

Stores every submitted incident.

Fields include:

* Report ID
* Anonymous Edit Code (hashed)
* Latitude
* Longitude
* Display Latitude
* Display Longitude
* Incident Categories
* Severity
* Description
* Incident Date
* Incident Time
* Status
* Trust Score
* Created At
* Updated At

---

## Incident Categories

Stores predefined categories.

Examples:

* Catcalling
* Following
* Sexual Harassment
* Theft
* Poor Lighting

A report may belong to multiple categories.

---

## Confirmations

Stores community confirmations.

Fields:

* Confirmation ID
* Report ID
* Browser Fingerprint Hash
* Confirmation Type
* Timestamp

Confirmation Types:

* Experienced Similar
* Still Unsafe
* Conditions Improved

---

## Media

Private evidence uploaded by users.

Fields:

* Media ID
* Report ID
* File URL
* File Type
* Upload Time

Media is visible only to moderators.

GPS metadata should be removed automatically before storage.

---

## Moderation Queue

Stores reports requiring manual review.

Fields:

* Queue ID
* Report ID
* Flag Reason
* Moderator Decision
* Notes
* Timestamp

---

# 5. Relationships

```
Report

├── Multiple Categories

├── Multiple Confirmations

├── Multiple Media Files

└── Optional Moderation Record
```

---

# 6. Safety Score Model

Each area receives a continuously updated score.

Factors:

* Number of incidents
* Incident severity
* Community confirmations
* Time decay (older reports gradually lose weight)
* Geographic density
* Report Trust Score

Safety Score Range:

```
85–100 Safe

70–84 Mostly Safe

50–69 Caution

30–49 Unsafe

0–29 Avoid
```

---

# 7. Report Trust Score

Each report receives an internal confidence score.

Positive Signals:

* Multiple community confirmations
* Similar nearby reports
* Reasonable submission behavior

Negative Signals:

* Excessive submissions
* Duplicate descriptions
* Repeated reports from the same browser
* Automated/spam behavior
* Suspicious VPN/proxy usage (supporting signal only)

Reports with low trust are automatically flagged for moderation.

---

# 8. Moderation Workflow

```
User Submits Report

↓

Automatic Validation

↓

Trust Score Calculation

↓

Normal Score?

Yes → Publish Immediately

↓

Community Confirmation

↓

Safety Score Updated
```

If flagged:

```
Automatic Flag

↓

Moderator Review

↓

Approve

Archive

Remove

Merge Duplicate
```

---

# 9. Privacy Architecture

Sotorko follows a privacy-first approach.

Key principles:

* No account required.
* No public user identity.
* No public uploader information.
* Exact GPS stored securely (with user consent).
* Public map displays a randomized 5–15 meter offset.
* Uploaded media remains private to moderators.
* Photo metadata (EXIF/GPS) is removed before storage.
* Anonymous edit codes are stored only as hashed values.

---

# 10. Future Expansion

The architecture should support future modules without major redesign:

* Mobile applications
* Push notifications
* Safe route recommendations
* SOS system
* NGO & researcher dashboards
* Verified authority accounts
* Public APIs
* Nationwide expansion beyond Dhaka

The MVP database and navigation should be designed with scalability in mind so that future features extend the existing architecture rather than replacing it.
