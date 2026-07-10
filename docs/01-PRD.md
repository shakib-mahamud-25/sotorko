# Product Requirements Document (PRD)

# Sotorko

**Version:** MVP v1.0
**Status:** Product Definition
**Author:** Project Founder
**Document Purpose:** Define the vision, scope, functional requirements, and success criteria for the first public release of Sotorko.

---

# 1. Executive Summary

## Product Name

**Sotorko (সতর্ক)**

**Tagline**

> Know Before You Go.

## Mission

To provide women with community-driven safety information across Dhaka through anonymous crowdsourced reporting, enabling them to make informed travel decisions while promoting awareness and public accountability regarding unsafe areas.

## Vision

To become Bangladesh's largest community-powered women's safety intelligence platform, helping women navigate cities more safely while generating valuable data for advocacy, research, NGOs, and policymakers.

---

# 2. Problem Statement

Women in Dhaka frequently encounter harassment, stalking, unsafe transportation, poorly lit streets, and other safety concerns. Despite this, there is no centralized platform where they can quickly determine whether an area is considered safe based on real community experiences.

Currently, safety information is fragmented across Facebook posts, personal networks, messaging apps, and individual experiences, making it difficult to access, verify, or preserve over time.

Sotorko addresses this gap by transforming anonymous community reports into actionable safety intelligence presented on an interactive map.

---

# 3. Product Goals

### Primary Goal

Allow women to quickly determine the safety of a location before traveling there.

### Secondary Goals

* Enable anonymous incident reporting.
* Visualize unsafe locations across Dhaka.
* Build a continuously growing safety database.
* Encourage community participation.
* Support future advocacy and research initiatives.
* Increase public awareness regarding women's safety.

---

# 4. Target Users

## Primary Users

Women living, studying, or working in Dhaka.

Examples include:

* University students
* Office workers
* Commuters
* Night-shift workers
* Visitors unfamiliar with an area

## Secondary Users (Future)

* NGOs
* Researchers
* Urban planners
* Universities
* Government organizations
* Journalists

---

# 5. Core User Journey

### User Goal

> "I want to know whether the place I'm going is safe."

Typical journey:

1. Open Sotorko.
2. Search for a destination.
3. View Safety Score.
4. Explore nearby reports.
5. Filter by incident type or time.
6. Decide whether to travel or choose an alternative route.

Secondary journey:

1. Experience an incident.
2. Open Sotorko.
3. Submit an anonymous report.
4. Receive a unique edit code.
5. Save the code for future edits or deletion.

---

# 6. MVP Features

## Interactive Safety Map

* Interactive city map
* Heatmap visualization
* Incident pins
* Current location button
* Search locations across Dhaka

---

## Anonymous Reporting

Users can submit reports without creating an account.

Required information:

* Incident category
* Severity
* Date
* Time
* Approximate location

Optional:

* Short description
* Photo(s) for moderators only

---

## Privacy Protection

Users may:

* Select location manually
* Allow GPS access

The system stores the original coordinates securely but displays the public location with a randomized 5–15 meter offset to reduce privacy risks.

Reporter identity is never publicly displayed.

---

## Safety Score

Every location receives a dynamic Safety Score (0–100).

The score is calculated using:

* Number of reports
* Severity
* Community confirmations
* Report recency
* Report trust score
* Geographic density of incidents

Safety Levels:

* 85–100: Safe
* 70–84: Mostly Safe
* 50–69: Caution
* 30–49: Unsafe
* 0–29: Avoid if Possible

---

## Community Confirmation

Users can strengthen existing reports by indicating:

* "I experienced something similar."
* "I still feel unsafe here."
* "Conditions have improved."

This increases confidence without requiring lengthy discussions.

---

## Dynamic Filters

Users can filter by:

* Incident category
* Severity
* Year
* Last 6 months
* Last 12 months
* Last 2 years
* Day/Night
* Heatmap or Pins

---

## Analytics Dashboard

Homepage statistics include:

* Incidents today
* Most dangerous areas
* Trending hotspots
* Day vs. Night comparison
* Weekly trends

---

# 7. Incident Categories

Initial categories:

* Catcalling
* Verbal harassment
* Following/Stalking
* Groping
* Sexual harassment
* Suspicious individuals
* Poor lighting / isolated area
* Theft / Attempted theft
* Unsafe public transport
* Other

Each report may belong to multiple categories.

---

# 8. Trust & Moderation

Reports are published immediately unless flagged by the abuse detection system.

Abuse detection considers:

* Browser fingerprint (privacy-conscious)
* Rate limiting
* Submission frequency
* Similar report descriptions
* Duplicate locations
* Suspicious activity patterns
* VPN/proxy usage (supporting signal only)

Flagged reports enter moderator review.

Moderators may:

* Approve
* Archive
* Remove
* Merge duplicates

---

# 9. Anonymous Editing

After submission, users receive a unique report management code.

This code is displayed only once.

The user is advised to save it securely.

Using this code, they can later:

* Edit the report
* Delete the report
* Add additional information

No account is required.

---

# 10. Non-Functional Requirements

The platform must be:

* Mobile-first
* Fast on low-bandwidth networks
* Responsive
* Accessible
* Bilingual (Bangla and English)
* Secure
* Privacy-focused
* Scalable
* Easy to moderate

---

# 11. Out of Scope (MVP)

The following are intentionally excluded from the first release:

* Mobile applications
* User accounts
* Push notifications
* Email notifications
* Police integration
* NGO dashboards
* Business responses
* Public photo galleries
* Public researcher API
* Route optimization
* SOS emergency features

These may be introduced in future versions.

---

# 12. Success Metrics

The MVP will be considered successful if it achieves:

### Adoption

* 1,000+ verified community reports
* Active usage across Dhaka
* Consistent monthly growth

### Engagement

* High report completion rate
* Frequent area searches
* Strong community confirmations

### Impact

* Women use the platform before traveling.
* Media coverage raises awareness.
* NGOs or public institutions reference the data.
* The platform contributes to conversations about women's safety in Bangladesh.

---

# 13. Guiding Principles

Every product decision should follow these principles:

1. Privacy before convenience.
2. Anonymous participation encourages reporting.
3. Information should help women make informed decisions, not spread fear.
4. Data should be transparent, community-driven, and responsibly moderated.
5. Simplicity is preferred over unnecessary complexity.
6. The map is the product; reporting exists to keep the map useful.
7. Sotorko is a public-interest platform, not a social media network.

---

# MVP Summary

Sotorko is a privacy-first, anonymous, community-powered safety intelligence platform for women in Dhaka. Through crowdsourced reports, dynamic Safety Scores, heatmaps, and interactive maps, it enables women to quickly evaluate the safety of locations before traveling while building a long-term dataset that supports awareness, advocacy, and safer urban mobility.
