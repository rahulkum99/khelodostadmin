import React, { useEffect, useRef, useState } from 'react';

function OddsCell({ value, type }) {
  const [blink, setBlink] = useState(false);
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (previousValueRef.current !== value) {
      if (value && value > 0) {
        setBlink(true);
        const timeoutId = setTimeout(() => setBlink(false), 600);
        previousValueRef.current = value;
        return () => clearTimeout(timeoutId);
      }
      previousValueRef.current = value;
    }
    return undefined;
  }, [value]);

  if (!value || value <= 0) {
    return <span className="odds">0</span>;
  }

  return (
    <span className={`odds ${type} ${blink ? 'blink' : ''}`}>
      {Number(value).toFixed(2)}
    </span>
  );
}

export default OddsCell;

