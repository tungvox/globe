import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Action types
const ADD_MARKER = 'ADD_MARKER';
const REMOVE_MARKER = 'REMOVE_MARKER';
const RENAME_MARKER = 'RENAME_MARKER';
const SET_MAP_INSTANCE = 'SET_MAP_INSTANCE';
const SET_SELECTED_LOCATION = 'SET_SELECTED_LOCATION';
const SET_SELECTED_MARKER = 'SET_SELECTED_MARKER';

// Initial state
const initialState = {
  markers: new Set(),
  mapInstance: null,
  selectedLocation: null,
  selectedMarker: null,
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ADD_MARKER: {
      const newMarkers = new Set(state.markers);
      newMarkers.add(action.payload);
      return { ...state, markers: newMarkers };
    }
    case REMOVE_MARKER: {
      const newMarkers = new Set(state.markers);
      newMarkers.delete(action.payload);
      return { ...state, markers: newMarkers };
    }
    case RENAME_MARKER: {
      const { marker, newName } = action.payload;
      marker.name = newName;
      // Update the tooltip as well
      const coordinates = marker.getLngLat();
      marker.getElement().title = `Name: ${newName}\nLongitude: ${coordinates.lng.toFixed(4)}\nLatitude: ${coordinates.lat.toFixed(4)}`;
      return { ...state }; // Trigger re-render
    }
    case SET_MAP_INSTANCE:
      return { ...state, mapInstance: action.payload };
    case SET_SELECTED_LOCATION:
      return { ...state, selectedLocation: action.payload };

    case SET_SELECTED_MARKER:
      return { ...state, selectedMarker: action.payload };
    default:
      return state;
  }
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Memoized action creators
  const addMarker = useCallback((marker) => {
    dispatch({ type: ADD_MARKER, payload: marker });
  }, []);

  const removeMarker = useCallback((marker) => {
    marker.remove(); // Remove from map
    dispatch({ type: REMOVE_MARKER, payload: marker });
  }, []);

  const renameMarker = useCallback((marker, newName) => {
    dispatch({ type: RENAME_MARKER, payload: { marker, newName } });
  }, []);

  const setMapInstance = useCallback((instance) => {
    dispatch({ type: SET_MAP_INSTANCE, payload: instance });
  }, []);

  const setSelectedLocation = useCallback((location) => {
    dispatch({ type: SET_SELECTED_LOCATION, payload: location });
  }, []);



  const setSelectedMarker = useCallback((marker) => {
    dispatch({ type: SET_SELECTED_MARKER, payload: marker });
  }, []);

  const value = {
    ...state,
    addMarker,
    removeMarker,
    renameMarker,
    setMapInstance,
    setSelectedLocation,
    setSelectedMarker,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};