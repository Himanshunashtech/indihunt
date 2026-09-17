"use client";

import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { User } from "@supabase/supabase-js";
import { Profile } from "./supabase";

// Auth Slice
interface AuthState {
  user: any | null; // using any to avoid strict User type mismatch between packages if any
  profile: Profile | null;
  loading: boolean;
}

const initialAuthState: AuthState = {
  user: null,
  profile: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    setUser: (state, action: PayloadAction<any | null>) => {
      state.user = action.payload;
      state.loading = false;
    },
    setProfile: (state, action: PayloadAction<Profile | null>) => {
      state.profile = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.profile = null;
      state.loading = false;
    }
  }
});


// Theme Slice
interface ThemeState {
  value: "light" | "dark";
}

const initialThemeState: ThemeState = {
  value: "light",
};

const themeSlice = createSlice({
  name: "theme",
  initialState: initialThemeState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.value = action.payload;
    },
    toggleThemeState: (state) => {
      state.value = state.value === "light" ? "dark" : "light";
    },
  },
});

// Navigation / View Slice
interface NavigationState {
  activeBoardTab: "products" | "discussions";
  searchQuery: string;
  countryFilter: string;
}

const initialNavigationState: NavigationState = {
  activeBoardTab: "products",
  searchQuery: "",
  countryFilter: "Global",
};

const navigationSlice = createSlice({
  name: "navigation",
  initialState: initialNavigationState,
  reducers: {
    setActiveBoardTab: (state, action: PayloadAction<"products" | "discussions">) => {
      state.activeBoardTab = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setCountryFilter: (state, action: PayloadAction<string>) => {
      state.countryFilter = action.payload;
    },
  },
});

// UI Slice
interface UiState {
  authModalOpen: boolean;
}

const initialUiState: UiState = {
  authModalOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState: initialUiState,
  reducers: {
    setAuthModalOpen: (state, action: PayloadAction<boolean>) => {
      state.authModalOpen = action.payload;
    },
  },
});

export const { setTheme, toggleThemeState } = themeSlice.actions;
export const { setActiveBoardTab, setSearchQuery, setCountryFilter } = navigationSlice.actions;
export const { setAuthModalOpen } = uiSlice.actions;
export const { setUser, setProfile, setLoading, logout } = authSlice.actions;

// Configure Store
export const store = configureStore({
  reducer: {
    theme: themeSlice.reducer,
    navigation: navigationSlice.reducer,
    ui: uiSlice.reducer,
    auth: authSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
