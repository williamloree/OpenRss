import { useState, useEffect } from 'react';

const VERSION_STORAGE_KEY = 'openrss_last_seen_version';

export function useVersion() {
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Get current version from API (reads package.json)
        const response = await fetch('/api/version');
        const data = await response.json();
        const version = data.version;

        setCurrentVersion(version);

        // Get last seen version from localStorage
        const lastSeenVersion = localStorage.getItem(VERSION_STORAGE_KEY);

        console.log('[useVersion] Current version:', version);
        console.log('[useVersion] Last seen version:', lastSeenVersion);

        // If no last seen version or different version, show patch notes
        if (!lastSeenVersion || lastSeenVersion !== version) {
          console.log('[useVersion] Showing patch notes for new version');
          setIsNewVersion(true);
          setShowPatchNotes(true);
        }
      } catch (error) {
        console.error('[useVersion] Error checking version:', error);
      }
    };

    checkVersion();
  }, []);

  const markVersionAsSeen = () => {
    if (currentVersion) {
      console.log('[useVersion] Marking version as seen:', currentVersion);
      localStorage.setItem(VERSION_STORAGE_KEY, currentVersion);
      setShowPatchNotes(false);
      setIsNewVersion(false);
    }
  };

  const openPatchNotes = () => {
    setShowPatchNotes(true);
  };

  return {
    showPatchNotes,
    isNewVersion,
    markVersionAsSeen,
    openPatchNotes,
    currentVersion
  };
}
