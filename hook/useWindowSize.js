import { useState, useEffect } from "react";

/**
 * Custom hook to track browser window size
 * @returns {Object} Current window size {width, height}
 */
export default function useWindowSize() {
  // Initialize state with undefined values
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // Handler function to update size
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler immediately to update state with current window size
    handleResize();

    // Cleanup function to remove event listener
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Only run once when component mounts

  return windowSize;
}
