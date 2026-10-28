# ✈️ My Trip Buddy

An app for organizing trips you've already booked, designed for travelers who get anxious before a trip. It brings the trip's information together in one place:

- flights, hotels, a day-by-day itinerary, checklist, budget and outfits
- a countdown to departure
- visa reminder

Built with React Native, Expo and TypeScript, with Supabase sync.

---

## Features

### Login
- Sign in with **Google** or by **email**, with a magic link or a 6-digit code (Supabase Auth).

### Create and edit a trip
3-step form:

1. **About the trip:** name, destinations (one at a time) and departure and return dates, with the number of nights calculated automatically.
2. **Flights and hotels:**
   - Flights per destination: flight number and date. From the flight date on, the destination shows up in the itinerary automatically.
   - Hotels per destination: name, check-in/check-out dates and confirmation code.
3. **Review:** trip summary, a reminder to check visa requirements and a preview of the generated checklist.

Trips can be edited or deleted later.

### Home
- **Countdown** to departure in days, hours, minutes and seconds.
- **Trip cover** with a photo from the gallery, which can be changed.
- **World map** with pins on the destinations, plus the total number of destinations and nights.
- **Checklist** generated automatically by category (docs, flight, hotel, outfits, visa and other). It adapts to the trip:
  - "Book hotel" if there's no accommodation yet
  - local cash for destinations where cash is widely used
  - vaccines for destinations that require them

  You can also add your own items and check off completed ones.
- **Accommodations** with a photo of the place (Google Street View), address, dates, nights, confirmation code and a Google Maps link.
- **Confirmations** for flights and hotels.
- Shortcut to the **budget**.

### Trips
- List of all trips, with an illustrated empty state to create the first one.

### Itinerary
- **Day carousel** for the trip, including an "unscheduled" tab.
- **Interactive map** (Leaflet + OpenStreetMap) with the day's destinations, each country in its own color.
- **Place search** (Photon / OpenStreetMap) to add sights to each day.
- Tap a destination to open the route in **Google Maps** from your current location, or open the route for the whole day.
- **Offline mode:** without internet, shows the day's list without the map or search.

### Outfits
- **Folders per country** in the trip, with outfits organized by day.
- Add outfits from the phone's **gallery**.
- **Destination inspiration** from Unsplash, with search and multi-select.
- Shortcut to search outfits on **Pinterest** using the destination as the search term.
- Full-screen outfit viewer.

### Budget
- Total budget in the chosen currency, showing amount spent, amount remaining and how much over budget.
- **Expenses** with amount, currency, category (transport, accommodation, food, activities, shopping and other), day and note.
- **Automatic currency conversion** via the Frankfurter API. The app warns when an expense couldn't be converted.
- Spending grouped by category.

### Profile and notifications
- **Countdown reminders:** choose how many days in advance to be notified (50, 40, 30, 20, 10, 5 or 1) or a custom value.
- Sign out.

### General
- **Languages:** Portuguese and English.
- **Cloud sync:** trips, checklist, outfits and places are stored on the device (AsyncStorage) and synced to Supabase. Images go to Supabase Storage.
- **Caching** of hotel and flight data to reduce API calls.

---

## Tech stack

| Area | Technologies |
| --- | --- |
| Core | Expo 54, React Native 0.81, React 19, TypeScript, Expo Router |
| Data and auth | Supabase (Postgres, Auth, Storage), AsyncStorage, Google Sign-In |
| Maps | Leaflet + OpenStreetMap (WebView), d3-geo + world-atlas (world map), Photon (geocoding) |
| APIs | Google Street View, Unsplash, Frankfurter (exchange rates), AirLabs (flights) |
| UI | Reanimated, Gesture Handler, Bottom Sheet, Linear Gradient, SVG, Haptics |
| Other | expo-notifications, NetInfo, i18next, date-fns |

---

## Project structure

```
app/
  (tabs)/            Home, Trips, Itinerary, Outfits, Profile
  trip-form.tsx      Create/edit trip
  budget.tsx         Budget
  pinterest-picker.tsx  Outfit picker (gallery, Unsplash, Pinterest)
  looks-days.tsx, look-viewer.tsx
  login.tsx
components/          Maps, calendars, cards, pickers
hooks/               useTrips (state and sync), useAuth, useCountdown, useNetworkStatus
utils/               Integrations (supabase, currency, geocode, hotelDataService,
                     flightService, unsplash, pinterest, notifications)
i18n/locales/        pt and en
supabase_migration.sql, supabase_storage_migration.sql
```

---

## Getting started

### Prerequisites
- Node.js 20+
- Android Studio or Xcode. The app uses native modules (Google Sign-In), so it needs a development build. It doesn't run in Expo Go.
- A Supabase project

### Supabase
In the SQL Editor, run:
1. `supabase_migration.sql`, which creates the `app_data` table
2. `supabase_storage_migration.sql`, which creates the `trip-images` bucket

### Environment variables
Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=          # Street View for accommodations
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=      # outfit inspiration
```

Without Supabase configured, the app works with local storage only.

### Run

```bash
npm install
npm run android    # or: npm run ios
```

EAS builds: `development`, `preview` (APK) and `production` profiles in `eas.json`.
