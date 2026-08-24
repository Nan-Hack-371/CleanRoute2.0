# CleanRoute Design Exploration

## Three stylistic approaches

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| Transit Field Notes | An editorial public-service dashboard inspired by transit wayfinding, printed survey cards, and clipped municipal notices. It makes a sensitive, practical utility feel calm and accountable. | 0.06 |
| Friendly Civic Atlas | A bright cartographic interface built around local colour, layered maps, and approachable accessibility cues. It prioritises discovery and friendly participation. | 0.08 |
| Night-Shift Signal | A low-light operational console focused on safety after dark, using stark contrast and high-visibility indicators. It feels purposeful but less suited to broad daytime civic use. | 0.04 |

## Chosen direction — Transit Field Notes

### Design Movement

Contemporary editorial wayfinding, borrowing the clarity of transit signage, field-research notebooks, and restrained municipal information design.

### Core Principles

1. **Evidence before decoration:** Ratings and source status are always legible, comparable, and explicitly qualified.
2. **Wayfinding rhythm:** Information is arranged as a route—orientation, filters, comparison, then findings—rather than a centred marketing landing page.
3. **Human-scale utility:** Warm paper-like surfaces and plain-language labels make a sensitive public-service task feel non-judgmental.
4. **Accessible hierarchy:** Strong contrast, generous hit targets, visible states, and colour-plus-icon status communication are non-negotiable.

### Color Philosophy

The base is soft paper ivory and deep ink, suggesting trustworthy field documentation without feeling institutional. CleanRoute Green is reserved for verified strengths and confident calls to action; burnt saffron adds urgent but non-alarmist attention to gaps. Blue-grey map lines provide orientation without competing with the ratings.

### Layout Paradigm

An asymmetric field-board layout uses a persistent left rail for navigation and survey context, while the main workspace combines an overscaled locator header, a map-like placement panel, and a responsive run of inspection cards. On small screens, the rail becomes a compact status strip and the inspection cards become a vertical route.

### Signature Elements

1. **Route-line dividers:** A thin dotted route traces between major information blocks.
2. **Inspection stamps:** Bordered, compact status labels use icons and concise evidence language.
3. **Coordinate chips:** Locations are identified through station/market context and small directional details, echoing wayfinding plaques.

### Interaction Philosophy

Filters should work like choosing a route: immediate, reversible, and visible. Selecting a location raises its full survey evidence and updates the map marker and comparison chart together. Interfaces explain the limits of desk research rather than implying certainty.

### Animation

The route line has a single, subtle initial draw; markers and cards enter with 40–60 ms staggered fades and a two-pixel upward movement. Filters use 160 ms colour and shadow transitions; active selection slides a 3 px indicator along the rail. All non-essential motion is disabled for reduced-motion preferences.

### Typography System

**DM Sans** provides compact, highly legible interface text and data labels. **Fraunces** is reserved for the display title and one key editorial insight, adding human warmth and authority. Display headings use 600–700 weight with modest negative tracking; body text remains 400–500 weight with generous line height. No Inter is used.

### Brand Essence

**CleanRoute is a practical, evidence-conscious guide for commuters who need a safer, cleaner public toilet without guesswork.**

Personality: **considerate, grounded, precise**.

### Brand Voice

Headlines are direct and action-oriented; microcopy names uncertainty honestly, never overclaims. CTAs sound like a helpful field guide rather than generic onboarding.

> “Find a restroom that works for your journey.”

> “Desk-researched today. Community-verified next.”

### Wordmark & Logo

The mark is an abstract route pin: a rounded map pin cut through by a rising route line, with a small circular waypoint at its centre. It is used as a bold solid symbol, never as generic clip art. The wordmark pairs the name with a slightly condensed, custom-spaced DM Sans treatment.

### Signature Brand Color

**CleanRoute Green — #176B5A.** A deep mineral green that signals a dependable, hygienic choice without resembling a generic health-tech palette.

## Style Decisions

- Route logic is visible in every major section through a dotted continuation line, coordinate-style labels, or waypoint/stamp motifs; the page should read as one civic journey, not stacked panels.
- The locator retains a visible cartographic layer even if live map tiles are unavailable: route traces, pins, stop labels, and location coordinates communicate the product promise immediately.
- Evidence taxonomy is fixed: CleanRoute Green represents verified or confident signals; burnt saffron marks uncertainty and field-check gaps; blue-grey provides map orientation and audit context.
- The locator panel always exposes an active cartographic layer with route traces, labelled waypoints, coordinate chips, and a listing-versus-field-target legend.
- The dotted route line is structural: every major section begins with a route continuation and waypoint marker, carrying the visitor from orientation to source record.
- Discovery cards behave as compact field records: their source key, location precision, and verification gap take precedence over a general public rating.
