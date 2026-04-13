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
    // Load Google Maps script if not loaded
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDfh_ojB5d0L3Vs3Nu6k4berPbvRjzZvuI";
    
    if (!window.google) {
      if (!apiKey) {
        console.warn("Google Maps API Key is missing. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.");
      }
      
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => initMap();
        script.onerror = () => {
          console.error("Failed to load Google Maps script. Check your API key and internet connection.");
        };
        document.head.appendChild(script);
      }
    } else {
      initMap();
    }

    function initMap() {
      if (!mapDivRef.current) return;
      
      // Check if google.maps.Map is available to prevent TypeError
      if (!window.google || !window.google.maps || !window.google.maps.Map) {
        console.log("[UniversalMapView] Google Maps not fully loaded, retrying in 100ms...");
        setTimeout(initMap, 100);
        return;
      }
      
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
    }
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
