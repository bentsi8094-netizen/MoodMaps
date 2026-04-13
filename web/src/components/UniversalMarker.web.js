import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const UniversalMarker = ({ coordinate, children, onPress, map, zIndex, anchor }) => {
  const markerRef = useRef(null);
  const containerRef = useRef(document.createElement('div'));

  useEffect(() => {
    if (!map || !window.google || !window.google.maps || !window.google.maps.OverlayView) return;

    class CustomOverlay extends window.google.maps.OverlayView {
      constructor(container, coordinate, onClick) {
        super();
        this.container = container;
        this.coordinate = new window.google.maps.LatLng(coordinate.latitude, coordinate.longitude);
        this.onClick = onClick;
      }

      onAdd() {
        this.getPanes().overlayMouseTarget.appendChild(this.container);
        this.container.onclick = (e) => {
          if (this.onClick) {
            e.stopPropagation();
            this.onClick();
          }
        };
        this.container.style.position = 'absolute';
        this.container.style.cursor = 'pointer';
        this.container.style.zIndex = zIndex || '1';
      }

      draw() {
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(this.coordinate);
        if (point) {
          // Adjust for anchor (0.5, 0.5 is center)
          const x = anchor?.x !== undefined ? anchor.x : 0.5;
          const y = anchor?.y !== undefined ? anchor.y : 0.5;
          
          this.container.style.left = point.x + 'px';
          this.container.style.top = point.y + 'px';
          this.container.style.transform = `translate(-${x * 100}%, -${y * 100}%)`;
        }
      }

      onRemove() {
        if (this.container && this.container.parentNode) {
          try {
            this.container.parentNode.removeChild(this.container);
          } catch (e) {
            console.warn("[UniversalMarker] parentNode mismatch on removeChild:", e);
          }
        }
      }
    }

    const overlay = new CustomOverlay(containerRef.current, coordinate, onPress);
    overlay.setMap(map);
    markerRef.current = overlay;

    return () => {
      overlay.setMap(null);
    };
  }, [map, coordinate.latitude, coordinate.longitude, onPress, zIndex]);

  return createPortal(children, containerRef.current);
};

export default UniversalMarker;
