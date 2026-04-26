import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';

const UniversalMapView = forwardRef(({ 
  children, 
  style, 
  initialRegion, 
  onMapReady,
  mapPadding 
}, ref) => {
  const [mapInstance, setMapInstance] = React.useState(null);
  const mapDivRef = useRef(null);
  const googleMapRef = useRef(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 20;


  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration) => {
      if (mapInstance) {
        mapInstance.panTo({ lat: region.latitude, lng: region.longitude });
        // zoom level roughly corresponding to deltas
        const zoom = Math.round(Math.log2(360 / Math.max(region.latitudeDelta, region.longitudeDelta)));
        mapInstance.setZoom(zoom > 15 ? 15 : zoom);
      }
    }
  }));
  useEffect(() => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDfh_ojB5d0L3Vs3Nu6k4berPbvRjzZvuI";
    
    // Define Global Callback for Google Maps
    window.initMoodMap = () => {
      // 1. Safety check for DOM reference
      if (!mapDivRef.current) return;
      
      // 2. SAFETY CHECK: Ensure the Map constructor is actually available.
      // Even if Google calls this callback, some internal hydration might still be happening.
      if (!window.google || !window.google.maps || !window.google.maps.Map) {
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.warn(`[UniversalMapView] Google Maps context missing (Attempt ${retryCountRef.current}/${MAX_RETRIES}), retrying in 500ms...`);
          setTimeout(() => {
            if (window.initMoodMap) window.initMoodMap();
          }, 500);
        } else {
          console.error("[UniversalMapView] Max retries reached. Google Maps failed to initialize.");
        }
        return;
      }
      
      try {
        const map = new window.google.maps.Map(mapDivRef.current, {
          center: { 
            lat: initialRegion?.latitude || 31.7683, 
            lng: initialRegion?.longitude || 35.2137 
          },
          zoom: 13,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        googleMapRef.current = map;
        setMapInstance(map);
        if (onMapReady) onMapReady();
      } catch (err) {
        console.error("[UniversalMapView] Error creating map instance:", err);
      }
    };

    if (!window.google) {
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMoodMap`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          console.error("Failed to load Google Maps script. Check your API key and internet connection.");
        };
        document.head.appendChild(script);
      }
    } else {
      // If script is already there, manually trigger the initialization
      // We wrap it in a small timeout to ensure it happens AFTER the div is rendered in the current mount cycle
      setTimeout(() => {
        retryCountRef.current = 0; // Reset count for manual trigger
        if (window.initMoodMap) window.initMoodMap();
      }, 100);
    }

    return () => {
      // ROOT CAUSE FIX: DO NOT delete window.initMoodMap here.
      // Deleting it while the script might still be loading or hydrating causes the 'undefined' crash.
      // Keeping it defined is safe as it will just exit if mapDivRef.current is null.
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      <div 
        ref={mapDivRef} 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%', 
          height: '100%',
          backgroundColor: '#e5e3df' // Loading color
        }} 
      />
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { map: mapInstance });
        }
        return child;
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300, // Ensure it has a base height
    overflow: 'hidden',
  }
});

export const PROVIDER_GOOGLE = 'google';
export default UniversalMapView;
