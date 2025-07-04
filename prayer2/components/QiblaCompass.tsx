
import React, { useState, useEffect } from 'react';

interface QiblaCompassProps {
  userLocation: { lat: number; lon: number } | null;
}

const KAABA_LOCATION = { lat: 21.4225, lon: 39.8262 };

const QiblaCompass: React.FC<QiblaCompassProps> = ({ userLocation }) => {
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [compassHeading, setCompassHeading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLocation) return;

    const { lat: lat1, lon: lon1 } = userLocation;
    const { lat: lat2, lon: lon2 } = KAABA_LOCATION;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;
    
    const y = Math.sin(toRad(lon2 - lon1));
    const x = Math.cos(toRad(lat1)) * Math.tan(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lon2 - lon1));
    let bearing = toDeg(Math.atan2(y, x));
    bearing = (bearing + 360) % 360;
    
    setQiblaDirection(bearing);
  }, [userLocation]);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let heading = event.alpha; // Compass direction (0-360)
      
      // For iOS, `webkitCompassHeading` is more reliable
      if (typeof (event as any).webkitCompassHeading !== 'undefined') {
        heading = (event as any).webkitCompassHeading;
      }

      if (heading !== null) {
        setCompassHeading(heading);
        if(error) setError(null);
      } else {
        setError("Could not read compass heading. Please ensure your device has a magnetometer and permissions are granted.");
      }
    };
    
    // Check for DeviceOrientationEvent support
    if (window.DeviceOrientationEvent) {
       window.addEventListener('deviceorientation', handleOrientation);
    } else {
       setError("Device orientation not supported by your browser.");
    }
    
    return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [error]);

  const rotation = qiblaDirection - compassHeading;

  return (
    <div className="bg-base-200 p-6 rounded-2xl shadow-lg text-center h-full flex flex-col justify-between border border-white/10">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Qibla Direction</h2>
        <p className="text-sm text-text-secondary mb-4">Point the top of your phone to the Kaaba icon.</p>
      </div>
      {error ? (
        <div className="flex-grow flex items-center justify-center text-red-300">
          <p>{error}</p>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            <div className="absolute inset-0 bg-base-300 rounded-full" />
            <div className="absolute inset-0 transition-transform duration-500 ease-in-out" style={{ transform: `rotate(${rotation}deg)` }}>
              <div className="absolute top-0 left-1/2 -ml-3 w-6 text-center">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary"><path d="M12 2L2 21h20L12 2zm0 3.84L17.26 19H6.74L12 5.84z"/></svg>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-base-100 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                🕋
              </div>
            </div>
          </div>
        </div>
      )}
      <p className="text-lg font-semibold text-secondary">{Math.round(qiblaDirection)}° N</p>
    </div>
  );
};

export default QiblaCompass;
