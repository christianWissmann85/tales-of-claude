import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './WeatherEffects.module.css';

interface WeatherEffectsProps {
    weatherType: 'rain' | 'storm' | 'fog' | 'codeSnow' | 'clear';
    transitionProgress: number; // 0 to 1, for smooth transitions
}

interface Particle {
    id: string;
    char: string;
    style: React.CSSProperties;
    className: string;
}

// Configuration constants for particle counts and lightning timing
const MAX_RAIN_PARTICLES = 100;
const MAX_SNOW_PARTICLES = 70;
const LIGHTNING_MIN_DELAY = 3000; // 3 seconds
const LIGHTNING_MAX_DELAY = 7000; // 7 seconds

/**
 * Generates a single particle with random properties for animation.
 * @param type 'rain' or 'snow' to determine character set and animation styles.
 * @returns A Particle object with unique ID, character, and CSS styles.
 */
const generateParticle = (type: 'rain' | 'snow'): Particle => {
    const id = Math.random().toString(36).substring(2, 9); // Unique ID for React key
    const left = Math.random() * 100; // Horizontal position in viewport width (%)
    const animationDuration = 3 + Math.random() * 5; // Fall duration: 3 to 8 seconds
    const animationDelay = Math.random() * animationDuration; // Random start delay

    if (type === 'rain') {
        const chars = ['|', '/', '\\']; // ASCII characters for rain
        const char = chars[Math.floor(Math.random() * chars.length)];
        return {
            id,
            char,
            style: {
                left: `${left}vw`,
                animationDuration: `${animationDuration}s`,
                // Negative delay makes particles appear mid-animation from the start
                animationDelay: `-${animationDelay}s`,
                fontSize: `${1 + Math.random() * 0.5}em`, // Vary size slightly for depth
            },
            className: styles.rainParticle,
        };
    } else { // type === 'snow'
        const chars = ['0', '1', '*']; // Binary/code characters for snow
        const char = chars[Math.floor(Math.random() * chars.length)];
        const rotationDuration = 5 + Math.random() * 10; // Rotation duration: 5 to 15 seconds
        return {
            id,
            char,
            style: {
                left: `${left}vw`,
                // Combine fall and rotate animations
                animationDuration: `${animationDuration}s, ${rotationDuration}s`,
                animationDelay: `-${animationDelay}s, -${Math.random() * rotationDuration}s`,
                fontSize: `${1.2 + Math.random() * 0.8}em`, // Larger for snow
            },
            className: styles.snowParticle,
        };
    }
};

const WeatherEffects: React.FC<WeatherEffectsProps> = ({ weatherType, transitionProgress }) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [lightningFlash, setLightningFlash] = useState(false);
    const lightningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Memoize particle generation to ensure particles are only regenerated when weatherType changes.
    // This prevents unnecessary re-renders of particle elements and ensures stable animations.
    const currentParticles = useMemo(() => {
        if (weatherType === 'rain' || weatherType === 'storm') {
            return Array.from({ length: MAX_RAIN_PARTICLES }, () => generateParticle('rain'));
        } else if (weatherType === 'codeSnow') {
            return Array.from({ length: MAX_SNOW_PARTICLES }, () => generateParticle('snow'));
        }
        return [];
    }, [weatherType]); // Dependency array: re-run only if weatherType changes

    // Effect to update the particles state when `currentParticles` changes.
    // This is separated from `useMemo` to allow `setParticles` to trigger a re-render.
    useEffect(() => {
        setParticles(currentParticles);
    }, [currentParticles]);

    // Effect for managing lightning flashes during 'storm' weather.
    useEffect(() => {
        const scheduleLightning = () => {
            if (weatherType === 'storm') {
                // Calculate a random delay for the next lightning strike
                const delay = Math.random() * (LIGHTNING_MAX_DELAY - LIGHTNING_MIN_DELAY) + LIGHTNING_MIN_DELAY;
                lightningTimeoutRef.current = setTimeout(() => {
                    setLightningFlash(true); // Activate flash
                    setTimeout(() => setLightningFlash(false), 200); // Deactivate after 200ms
                    scheduleLightning(); // Schedule the next flash recursively
                }, delay);
            }
        };

        if (weatherType === 'storm') {
            scheduleLightning(); // Start the lightning cycle
        } else {
            // If not storm, clear any pending lightning timeouts
            if (lightningTimeoutRef.current) {
                clearTimeout(lightningTimeoutRef.current);
                lightningTimeoutRef.current = null;
            }
            setLightningFlash(false); // Ensure no lingering flash effect
        }

        // Cleanup function: clear timeout when component unmounts or weatherType changes
        return () => {
            if (lightningTimeoutRef.current) {
                clearTimeout(lightningTimeoutRef.current);
            }
        };
    }, [weatherType]); // Re-run this effect when weatherType changes

    // Calculate the overall opacity for the weather effects container.
    // When weatherType is 'clear', opacity is 0. Otherwise, it's controlled by transitionProgress.
    const containerOpacity = weatherType === 'clear' ? 0 : transitionProgress;

    // Calculate the opacity specifically for the fog overlay.
    // Fog opacity intensifies with transitionProgress, up to a maximum of 0.7.
    const fogOpacity = weatherType === 'fog' ? transitionProgress * 0.7 : 0;

    return (
        <div
            className={`${styles.weatherEffectsContainer} ${weatherType === 'clear' ? styles.clearEffects : ''}`}
            style={{ opacity: containerOpacity }}
        >
            {/* Render particles for rain, storm, or codeSnow */}
            {(weatherType === 'rain' || weatherType === 'storm' || weatherType === 'codeSnow') && (
                <div className={styles.particleContainer}>
                    {particles.map(p => (
                        <span key={p.id} className={`${styles.particle} ${p.className}`} style={p.style}>
                            {p.char}
                        </span>
                    ))}
                </div>
            )}

            {/* Lightning effect for storm */}
            {weatherType === 'storm' && (
                <div className={`${styles.lightningFlash} ${lightningFlash ? styles.active : ''}`}></div>
            )}

            {/* Fog overlay */}
            {weatherType === 'fog' && (
                <div className={styles.fogOverlay} style={{ opacity: fogOpacity }}></div>
            )}
        </div>
    );
};

export default WeatherEffects;