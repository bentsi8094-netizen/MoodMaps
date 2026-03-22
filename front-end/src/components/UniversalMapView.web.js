import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';

const UniversalMapView = forwardRef(({ 
  children, 
  style, 
  initialRegion, 
  onMapReady,
  mapPadding 
}, ref) => {
  const mapDivRef = useRef(null);
  const googleMapRef = useRef(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration) => {
      if (googleMapRef.current) {
        googleMapRef.current.panTo({ lat: region.latitude, lng: region.longitude });
        // zoom level roughly corresponding to deltas
        const zoom = Math.round(Math.log2(360 / Math.max(region.latitudeDelta, region.longitudeDelta)));
        googleMapRef.current.setZoom(zoom > 15 ? 15 : zoom);
      }
    }
  }));

  useEffect(() => {
    // Load Google Maps script if not loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDfh_ojB5d0L3Vs3Nu6k4berPbvRjzZvuI`; // Using the key from app.json
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapDivRef.current) return;
      
      const map = new window.google.maps.Map(mapDivRef.current, {
        center: { 
          lat: initialRegion?.latitude || 31.7683, 
          lng: initialRegion?.longitude || 35.2137 
        },
        zoom: 13,
        disableDefaultUI: true,
        styles: [
          {
            "elementType": "geometry",
            "stylers": [{"color": "#242f3e"}]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#746855"}]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#242f3e"}]
          },
          {
            "featureType": "administrative.locality",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#d59563"}]
          },
          // ... more dark mode styles can be added to match the app's look
        ]
      });

      googleMapRef.current = map;
      if (onMapReady) onMapReady();
    }
  }, []);

  return (
    <View style={[styles.container, style]}>
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
      {/* Passing the map instance to children (Markers) via context or cloneElement could be complex, 
          so we'll handle Markers inside the Map component or via a simple global/ref approach. */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { map: googleMapRef.current });
        }
        return child;
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export const PROVIDER_GOOGLE = 'google';
export default UniversalMapView;
