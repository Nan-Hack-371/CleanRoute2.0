# CleanRoute 🚻

### Public Toilet Locator & Community Verification Platform

CleanRoute is a web-based public toilet locator designed to help people discover nearby public toilets and make more informed choices based on location, hygiene, accessibility, women-friendly facilities, operating status, and community feedback.

The project focuses on making public toilet information easier to discover while clearly separating **public listing information** from **verified field observations** and **community feedback**.

---

## 📌 Project Overview

Finding a public toilet is not only about finding the nearest location. Users may also need information about:

- Hygiene condition
- Water availability
- Safety and lighting
- Wheelchair/step-free accessibility
- Women-friendly facilities
- Operating hours
- Community ratings and reviews
- Whether the information has been verified recently

CleanRoute brings these details together in a single interface.

The application currently focuses on selected locations across **Maharashtra**, including areas such as:

- Khopoli
- Rasayani
- Panvel
- Navi Mumbai

---

## 🎯 Objectives

The main objectives of CleanRoute are:

1. Help users find nearby public toilets.
2. Allow users to search toilets by area.
3. Provide useful facility information before visiting.
4. Support filtering based on accessibility and facility requirements.
5. Show distance from the user's current location.
6. Allow authenticated users to submit reviews and report issues.
7. Allow authorized administrators to manage toilet records.
8. Allow field verification of toilet information.
9. Provide moderation workflows for reviews and reports.
10. Clearly distinguish verified information from information that still requires verification.

---

## ✨ Main Features

### 👤 Public User Features

- Public toilet locator
- Search by area
- Find toilets near the user's location
- Distance-based sorting
- Toilet detail pages
- Facility and accessibility information
- Operating status
- Hygiene information
- Women-friendly information
- Wheelchair accessibility information
- Community reviews
- Report an issue
- Write a review
- My Contributions section
- Get directions

---

### 🗺️ Location & Map Features

CleanRoute provides location-based discovery through:

- Interactive map
- Toilet location markers
- Current-location detection
- Distance calculation
- Sort by distance
- Search by area
- Route/direction support

The application also provides location recovery guidance when accurate browser location is unavailable.

---

### 📝 Community Features

Authenticated users can contribute information through:

- Reviews
- Ratings
- Issue reports

Users can view their submitted contributions from **My Contributions**.

Community submissions go through the appropriate moderation workflow before being treated as verified public information.

---

### 🔐 Administrator Features

Administrative functionality is restricted to authorized administrator accounts.

The administrator panel provides:

- Admin dashboard
- Toilet listing management
- Add toilet
- Edit toilet
- Publish/unpublish toilet records
- Field verification
- Review moderation
- Report moderation
- Publication status management
- Facility information management

Administrators can update official facility records while normal users only have access to public/user-level functionality.

---

## 🔎 Information Verification

CleanRoute separates different types of information so users can understand how reliable a particular detail is.

For example:

- Public listing information
- Field-verified information
- Community feedback
- Information requiring verification

This prevents unverified information from being presented as confirmed field data.

---

## 🔄 Basic Workflow

```text
                  ┌─────────────────┐
                  │   Public User   │
                  └────────┬────────┘
                           │
                           ▼
                  Search / Locate Toilet
                           │
                           ▼
                  View Toilet Details
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
        Write Review              Report Issue
              │                         │
              └────────────┬────────────┘
                           ▼
                    Admin Moderation
                           │
                           ▼
                  Verified Information
