import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ptAuth from "./locales/pt/auth.json";
import ptBudget from "./locales/pt/budget.json";
import ptCommon from "./locales/pt/common.json";
import ptCurrencySelect from "./locales/pt/currencySelect.json";
import ptDateCarousel from "./locales/pt/dateCarousel.json";
import ptDestinationMap from "./locales/pt/destinationMap.json";
import ptDestinationSearch from "./locales/pt/destinationSearch.json";
import ptEmptyStateTrips from "./locales/pt/emptyStateTrips.json";
import ptHome from "./locales/pt/home.json";
import ptHotelCard from "./locales/pt/hotelCard.json";
import ptItinerary from "./locales/pt/itinerary.json";
import ptLogin from "./locales/pt/login.json";
import ptLookViewer from "./locales/pt/lookViewer.json";
import ptLooks from "./locales/pt/looks.json";
import ptLooksDays from "./locales/pt/looksDays.json";
import ptModal from "./locales/pt/modal.json";
import ptNotifRemindersPicker from "./locales/pt/notifRemindersPicker.json";
import ptPinterestPicker from "./locales/pt/pinterestPicker.json";
import ptProfile from "./locales/pt/profile.json";
import ptTabs from "./locales/pt/tabs.json";
import ptTripCalendar from "./locales/pt/tripCalendar.json";
import ptTripCalendarRange from "./locales/pt/tripCalendarRange.json";
import ptTripDatePicker from "./locales/pt/tripDatePicker.json";
import ptTripDateRangePicker from "./locales/pt/tripDateRangePicker.json";
import ptTripForm from "./locales/pt/tripForm.json";
import ptTrips from "./locales/pt/trips.json";

import enAuth from "./locales/en/auth.json";
import enBudget from "./locales/en/budget.json";
import enCommon from "./locales/en/common.json";
import enCurrencySelect from "./locales/en/currencySelect.json";
import enDateCarousel from "./locales/en/dateCarousel.json";
import enDestinationMap from "./locales/en/destinationMap.json";
import enDestinationSearch from "./locales/en/destinationSearch.json";
import enEmptyStateTrips from "./locales/en/emptyStateTrips.json";
import enHome from "./locales/en/home.json";
import enHotelCard from "./locales/en/hotelCard.json";
import enItinerary from "./locales/en/itinerary.json";
import enLogin from "./locales/en/login.json";
import enLookViewer from "./locales/en/lookViewer.json";
import enLooks from "./locales/en/looks.json";
import enLooksDays from "./locales/en/looksDays.json";
import enModal from "./locales/en/modal.json";
import enNotifRemindersPicker from "./locales/en/notifRemindersPicker.json";
import enPinterestPicker from "./locales/en/pinterestPicker.json";
import enProfile from "./locales/en/profile.json";
import enTabs from "./locales/en/tabs.json";
import enTripCalendar from "./locales/en/tripCalendar.json";
import enTripCalendarRange from "./locales/en/tripCalendarRange.json";
import enTripDatePicker from "./locales/en/tripDatePicker.json";
import enTripDateRangePicker from "./locales/en/tripDateRangePicker.json";
import enTripForm from "./locales/en/tripForm.json";
import enTrips from "./locales/en/trips.json";

const resources = {
  pt: {
    auth: ptAuth,
    budget: ptBudget,
    common: ptCommon,
    currencySelect: ptCurrencySelect,
    dateCarousel: ptDateCarousel,
    destinationMap: ptDestinationMap,
    destinationSearch: ptDestinationSearch,
    emptyStateTrips: ptEmptyStateTrips,
    home: ptHome,
    hotelCard: ptHotelCard,
    itinerary: ptItinerary,
    login: ptLogin,
    lookViewer: ptLookViewer,
    looks: ptLooks,
    looksDays: ptLooksDays,
    modal: ptModal,
    notifRemindersPicker: ptNotifRemindersPicker,
    pinterestPicker: ptPinterestPicker,
    profile: ptProfile,
    tabs: ptTabs,
    tripCalendar: ptTripCalendar,
    tripCalendarRange: ptTripCalendarRange,
    tripDatePicker: ptTripDatePicker,
    tripDateRangePicker: ptTripDateRangePicker,
    tripForm: ptTripForm,
    trips: ptTrips,
  },
  en: {
    auth: enAuth,
    budget: enBudget,
    common: enCommon,
    currencySelect: enCurrencySelect,
    dateCarousel: enDateCarousel,
    destinationMap: enDestinationMap,
    destinationSearch: enDestinationSearch,
    emptyStateTrips: enEmptyStateTrips,
    home: enHome,
    hotelCard: enHotelCard,
    itinerary: enItinerary,
    login: enLogin,
    lookViewer: enLookViewer,
    looks: enLooks,
    looksDays: enLooksDays,
    modal: enModal,
    notifRemindersPicker: enNotifRemindersPicker,
    pinterestPicker: enPinterestPicker,
    profile: enProfile,
    tabs: enTabs,
    tripCalendar: enTripCalendar,
    tripCalendarRange: enTripCalendarRange,
    tripDatePicker: enTripDatePicker,
    tripDateRangePicker: enTripDateRangePicker,
    tripForm: enTripForm,
    trips: enTrips,
  },
};

// Só detecção automática (sem toggle manual): segue o idioma do aparelho se
// for inglês, senão cai pro português — idioma nativo do app.
const deviceLanguage = Localization.getLocales()[0]?.languageCode;
const initialLanguage = deviceLanguage === "en" ? "en" : "pt";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "pt",
  ns: Object.keys(resources.pt),
  defaultNS: "common",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
