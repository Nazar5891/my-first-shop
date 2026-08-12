(() => {
  if (!navigator.geolocation || navigator.geolocation.__gpsFixApplied) return;

  const nativeGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
  navigator.geolocation.getCurrentPosition = function(success, error, options = {}) {
    let finished = false;
    const ok = (position) => {
      if (finished) return;
      finished = true;
      success?.(position);
    };
    const fail = (err) => {
      if (finished) return;
      // If high-accuracy GPS times out, retry with normal location for phones
      // that cannot obtain a satellite fix quickly.
      if (err?.code === 3 && options.enableHighAccuracy !== false) {
        nativeGetCurrentPosition(ok, (retryErr) => {
          if (!finished) {
            finished = true;
            error?.(retryErr);
          }
        }, { ...options, enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 });
        return;
      }
      finished = true;
      error?.(err);
    };

    nativeGetCurrentPosition(ok, fail, {
      ...options,
      enableHighAccuracy: options.enableHighAccuracy !== false,
      timeout: Math.max(options.timeout || 0, 30000),
      maximumAge: options.maximumAge ?? 30000,
    });
  };

  try {
    Object.defineProperty(navigator.geolocation, '__gpsFixApplied', { value: true });
  } catch (_) {}
})();
