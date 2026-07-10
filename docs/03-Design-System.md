# 03-Design-System.md

# Sotorko

## Design System & UI/UX Guidelines (MVP)

**Version:** 1.0
**Purpose:** Define Sotorko's visual identity, user experience principles, design language, and reusable UI components to ensure a consistent, premium, and trustworthy interface.

---

# 1. Design Philosophy

Sotorko is **not** a social media platform, a crime news website, or a government portal.

It is a **community-powered safety intelligence platform**.

The interface should communicate:

* Calm
* Trust
* Professionalism
* Simplicity
* Reliability

Users should feel informed—not frightened.

Every design decision should reduce cognitive load and help users quickly answer one question:

> **"Is this area safe?"**

---

# 2. Brand Personality

The product should feel:

* Calm rather than alarming
* Modern rather than corporate
* Premium rather than flashy
* Minimal rather than crowded
* Informative rather than emotional

Avoid:

* Bright neon colors
* Excessive animations
* Clickbait styling
* Social media aesthetics
* Fear-inducing visuals

---

# 3. Color Palette

## Primary

Deep Navy — **#0F172A**

Used for:

* Navigation
* Headers
* Primary buttons
* Branding

---

## Background

White — **#FFFFFF**

Light Gray — **#F8FAFC**

Used for clean layouts and high readability.

---

## Accent

Blue — **#2563EB**

Used for:

* Interactive elements
* Links
* Selected states
* Focus indicators

---

## Status Colors

Safe

Green — **#16A34A**

Mostly Safe

Light Green — **#22C55E**

Caution

Amber — **#F59E0B**

Unsafe

Orange — **#EA580C**

Avoid

Red — **#DC2626**

Information

Blue — **#2563EB**

These colors should remain consistent across maps, charts, badges, filters, and statistics.

---

# 4. Typography

Primary Font

**Inter**

Fallback:

* System UI
* Segoe UI
* Roboto
* Arial

Typography hierarchy:

* H1 — Hero titles
* H2 — Page titles
* H3 — Section titles
* Body Large
* Body
* Caption
* Label

Text should prioritize readability over decorative styling.

---

# 5. Spacing System

Use an 8-point spacing system.

Examples:

* 8px
* 16px
* 24px
* 32px
* 48px
* 64px

Maintain generous whitespace throughout the application.

Avoid cramped layouts.

---

# 6. Border Radius

Cards

12px

Buttons

10px

Inputs

10px

Modals

16px

Map popups

14px

Rounded corners should appear modern but not overly playful.

---

# 7. Iconography

Use a clean outlined icon set such as:

* Lucide
* Heroicons

Primary icons include:

* Location
* Warning
* Shield
* Search
* Filter
* Calendar
* Clock
* Map
* Heatmap
* Report
* Camera
* Information

Icons should remain simple and consistent.

---

# 8. Homepage Layout

The homepage is centered around the interactive map.

Layout:

```
Top Navigation

↓

Search Bar

↓

Interactive Map

↓

Safety Score Panel

↓

Heatmap / Pin Toggle

↓

Dynamic Filters

↓

Recent Incidents

↓

Analytics Cards

↓

Footer
```

The map occupies most of the first screen.

Users should not need to scroll to begin exploring.

---

# 9. Map Design

The map is the core product.

Requirements:

* Clean light theme
* Minimal labels
* High contrast pins
* Smooth zoom
* Responsive interaction

Display:

* Safety Score
* Heatmap
* Incident Pins
* Clustered markers
* Current location
* Search results

Public pin locations should be offset by 5–15 meters to protect privacy.

---

# 10. Safety Score Card

Each searched location displays a prominent score card.

Contents:

* Safety Score (0–100)
* Safety Level
* Trend indicator
* Recent incident count
* Community confidence
* Last updated timestamp

The score should be immediately understandable without reading additional text.

---

# 11. Incident Card

Each incident card should include:

* Category badge
* Severity badge
* Approximate location
* Date & time
* Optional short description
* Community confirmations
* Share button

Do not display:

* Reporter identity
* Uploaded evidence
* Exact GPS coordinates

---

# 12. Report Form

The reporting experience should take less than two minutes.

Sections:

1. Choose location
2. Incident category
3. Severity
4. Date & time
5. Short description (optional)
6. Upload photos (optional)
7. Privacy notice
8. Submit

After submission:

Display a unique edit/delete code once, with clear instructions to save it securely.

---

# 13. Buttons

Primary

Filled Navy

Secondary

Outlined

Danger

Red

Success

Green

Disabled

Gray

Hover and focus states should provide clear visual feedback.

---

# 14. Forms

Forms should be:

* Clean
* Accessible
* Mobile-friendly

Validation should be inline and helpful.

Avoid overwhelming users with unnecessary fields.

Required fields should be clearly marked.

---

# 15. Analytics Cards

Homepage analytics include:

* Incidents Today
* Most Dangerous Areas
* Trending Hotspots
* Day vs Night
* Weekly Trends

Cards should emphasize visual clarity over excessive detail.

---

# 16. Accessibility

The application should follow WCAG AA standards where practical.

Requirements:

* Keyboard navigation
* Screen reader compatibility
* High color contrast
* Visible focus states
* Accessible labels
* Responsive text scaling

Accessibility is a core requirement, not an afterthought.

---

# 17. Responsive Design

Design for:

* Mobile (primary)
* Tablet
* Desktop

The interface should adapt fluidly without losing functionality.

The map and search experience must remain intuitive on small screens.

---

# 18. Motion & Animation

Animations should be subtle and purposeful.

Recommended interactions:

* Smooth map transitions
* Fade-in cards
* Button hover effects
* Skeleton loaders
* Gentle modal animations

Avoid excessive movement or distracting effects.

---

# 19. UX Principles

Every screen should satisfy these principles:

1. The map is always the focal point.
2. Search is faster than browsing.
3. Users should reach any core feature within two interactions.
4. Privacy should be communicated clearly.
5. Reporting should require minimal effort.
6. Data should inspire confidence through transparency.
7. Every interface element should support informed decision-making.

---

# 20. Design Goal

The final product should feel like a polished civic technology platform rather than a social network.

If users compare Sotorko to existing products, it should evoke:

* The clarity of Google Maps
* The simplicity of Apple Maps
* The community intelligence of Waze
* The professionalism of a modern SaaS dashboard

The result should be a calm, trustworthy, premium experience that encourages women to consult Sotorko before traveling and to contribute anonymous reports that strengthen the community's collective knowledge.
