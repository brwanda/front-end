import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Singleton script loader ──────────────────────────────────────────────────
const listeners = [];
let scriptState = 'idle';

function loadGoogleMapsScript(apiKey) {
  if (scriptState === 'ready' || window.google?.maps?.places) {
    scriptState = 'ready';
    return Promise.resolve();
  }
  if (scriptState === 'loading') {
    return new Promise((resolve, reject) => listeners.push({ resolve, reject }));
  }

  scriptState = 'loading';
  return new Promise((resolve, reject) => {
    listeners.push({ resolve, reject });

    console.info('[useLocationPicker] Loading Google Maps…');

    window.__gmapsReady = () => {
      delete window.__gmapsReady;
      if (window.google?.maps?.places) {
        console.info('[useLocationPicker] Google Maps + Places API ready ✓');
        scriptState = 'ready';
        listeners.forEach(l => l.resolve());
      } else {
        const msg = 'Script loaded but Places API is missing. Enable "Places API" in Google Cloud Console.';
        console.error('[useLocationPicker]', msg);
        scriptState = 'error';
        listeners.forEach(l => l.reject(new Error(msg)));
      }
      listeners.length = 0;
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__gmapsReady`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window.__gmapsReady;
      scriptState = 'error';
      const msg =
        'Failed to load Google Maps. Check:\n' +
        '  1. "Maps JavaScript API" and "Places API" are enabled in Google Cloud Console\n' +
        '  2. API key has no referrer restrictions blocking localhost\n' +
        '  3. Billing is enabled on your Google Cloud project\n' +
        '  4. REACT_APP_GOOGLE_MAPS_API_KEY is correct in .env (restart dev server after editing)';
      console.error('[useLocationPicker]', msg);
      listeners.forEach(l => l.reject(new Error(msg)));
      listeners.length = 0;
    };
    document.head.appendChild(script);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * useLocationPicker
 *
 * Autocomplete-only location input — typing is allowed while searching
 * but the final committed value must come from a Places suggestion.
 *
 * @param {object}   options
 * @param {string}   options.defaultValue  Pre-filled address (edit forms)
 * @param {function} options.onChange      Called with { address, lat, lng, place } on selection
 * @param {boolean}  options.disabled      Disables the input entirely
 *
 * @returns {{ inputRef, isLoaded, scriptError, value, setValue }}
 */
export function useLocationPicker({ defaultValue = '', onChange, disabled = false } = {}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Track the last confirmed (Places-selected) value separately
  const confirmedValueRef = useRef(defaultValue);

  const [isLoaded, setIsLoaded] = useState(() => !!window.google?.maps?.places);
  const [scriptError, setScriptError] = useState(null);
  // Display value — free to change while user types to search
  const [value, setValue] = useState(defaultValue);

  // Sync pre-fill when defaultValue changes (edit form loads data)
  useEffect(() => {
    confirmedValueRef.current = defaultValue;
    setValue(defaultValue);
  }, [defaultValue]);

  // 1. Load Google Maps script
  useEffect(() => {
    if (isLoaded) return;
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey?.trim()) {
      const msg = 'REACT_APP_GOOGLE_MAPS_API_KEY is not set in your .env file.';
      console.error('[useLocationPicker]', msg);
      setScriptError(msg);
      setIsLoaded(true);
      return;
    }
    loadGoogleMapsScript(apiKey)
      .then(() => { setIsLoaded(true); setScriptError(null); })
      .catch(err => { setScriptError(err.message); setIsLoaded(true); });
  }, [isLoaded]);

  // 2. Attach autocomplete once
  useEffect(() => {
    if (!isLoaded || disabled || scriptError) return;
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ['formatted_address', 'geometry', 'name', 'address_components'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) {
          // User pressed Enter on a suggestion that hasn't resolved — revert to last confirmed
          console.warn('[useLocationPicker] No geometry on selected place, reverting.');
          setValue(confirmedValueRef.current);
          return;
        }
        const address = place.formatted_address || place.name || '';
        confirmedValueRef.current = address;
        setValue(address);
        onChangeRef.current?.({
          address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          place,
        });
      });

      autocompleteRef.current = autocomplete;
      console.info('[useLocationPicker] Autocomplete attached ✓');
    } catch (err) {
      console.error('[useLocationPicker] Failed to attach Autocomplete:', err);
      setScriptError(err.message);
    }
  }, [isLoaded, disabled, scriptError]);

  /**
   * handleInputChange — allows typing to search but does NOT commit the value.
   * If the user types and then clicks away without selecting a suggestion,
   * onBlur reverts the display back to the last confirmed Places selection.
   */
  const handleInputChange = useCallback((e) => {
    setValue(e.target.value);
  }, []);

  /**
   * handleBlur — if the user typed something but never picked a suggestion,
   * revert to the last confirmed value so the field stays clean.
   */
  const handleBlur = useCallback(() => {
    // Small delay so a suggestion click registers before we revert
    setTimeout(() => {
      setValue(confirmedValueRef.current);
    }, 200);
  }, []);

  return {
    inputRef,
    isLoaded,
    scriptError,
    value,
    setValue,
    handleInputChange,
    handleBlur,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * LocationPicker
 *
 * Drop-in autocomplete-only location input.
 * Users can type to search but the committed value must be a Places selection.
 * Blurring without selecting a suggestion reverts to the last valid value.
 *
 * Props:
 *   value        Controlled address string from parent state
 *   onChange     Called with plain address string when a place is selected
 *   defaultValue Seed value for edit forms
 *   disabled     Disables the input
 *   placeholder  Input placeholder text
 *   className    Extra CSS class for the input
 *   id / name    Forwarded to <input>
 *
 * Example:
 *   <LocationPicker
 *     id="location"
 *     value={meeting.location}
 *     onChange={(address) => setMeeting(prev => ({ ...prev, location: address }))}
 *     disabled={meeting.meetingMode !== 'PHYSICAL'}
 *   />
 */
export function LocationPicker({
  value: controlledValue,
  onChange: onChangeProp,
  defaultValue = '',
  disabled = false,
  placeholder = 'Search and select a location…',
  className = '',
  id,
  name,
}) {
  const seed = controlledValue !== undefined ? controlledValue : defaultValue;

  const handleSelect = useCallback(({ address }) => {
    onChangeProp?.(address);
  }, [onChangeProp]);

  const {
    inputRef,
    isLoaded,
    scriptError,
    value,
    setValue,
    handleInputChange,
    handleBlur,
  } = useLocationPicker({
    defaultValue: seed,
    onChange: handleSelect,
    disabled,
  });

  // Sync when parent updates controlled value (e.g. form reset or edit load)
  useEffect(() => {
    if (controlledValue !== undefined) setValue(controlledValue);
  }, [controlledValue, setValue]);

  if (!isLoaded) {
    return (
      <input
        type="text"
        placeholder="Loading location search…"
        disabled
        className={className}
        id={id}
        name={name}
      />
    );
  }

  if (scriptError) {
    // Script failed — input is locked, no manual entry allowed
    return (
      <div>
        <input
          type="text"
          id={id}
          name={name}
          value=""
          readOnly
          placeholder="Location search unavailable"
          disabled
          className={className}
        />
        <small style={{ color: '#e67e22', display: 'block', marginTop: 4 }}>
          ⚠ Could not load Google Maps. Check browser console (F12) for details.
        </small>
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      id={id}
      name={name}
      value={value}
      onChange={handleInputChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      className={className}
    />
  );
}

export default LocationPicker;