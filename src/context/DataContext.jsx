import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  getDocs,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { CRITERIA } from "../data";

const appId = "1:642440523500:web:993b21fc1a7b05dfaaffc9";

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeamsState] = useState([]);
  const [judges, setJudgesState] = useState([]);
  const [eventSettings, setEventSettings] = useState({});
  const [scores, setScores] = useState({});
  const [control, setControl] = useState({
    activeTeamId: null,
    globalLock: false,
    unlockedJudges: [],
    timer: { isRunning: false, seconds: 420 },
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const init = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (err) {
        console.warn(
          "Local storage not available, falling back to in-memory persistence:",
          err,
        );
        try {
          await setPersistence(auth, inMemoryPersistence);
        } catch (memErr) {
          console.error("Failed to set persistence:", memErr);
        }
      }

      if (typeof window !== "undefined" && window.__initial_auth_token) {
        try {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } catch (e) {
          console.error("Custom token sign-in failed", e);
          await signInAnonymously(auth);
        }
      } else {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Anonymous sign-in failed:", e);
        }
      }
    };
    init();

    const handleOnline = async () => {
      setIsOnline(true);
      // Sync offline scores when connection is restored
      const offlineScores =
        JSON.parse(localStorage.getItem("offlineScores")) || [];
      if (offlineScores.length > 0) {
        console.log(`Syncing ${offlineScores.length} offline scores`);
        for (const score of offlineScores) {
          try {
            await handleSubmitScore(
              score.teamId,
              score.detail,
              score.comment,
              score.signature,
              score.judgeProfile,
            );
          } catch (e) {
            console.error("Failed to sync offline score:", e);
          }
        }
        localStorage.removeItem("offlineScores");
        alert("Offline scores synced successfully!");
      }
    };

    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const unsubscribeAuth = onAuthStateChanged(auth, setUser);

    return () => {
      unsubscribeAuth();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Track loading state for initial data fetch
    let teamsLoaded = false;
    let judgesLoaded = false;
    let settingsLoaded = false;

    const checkLoaded = () => {
      if (teamsLoaded && judgesLoaded && settingsLoaded) {
        setIsLoading(false);
      }
    };

    // Optimized: Subscribe only to relevant scores (by judge) once judge profile is available
    const unsubScores = () => {};
    let scoresSubscription = null;

    // Teams collection instead of single document
    const qTeams = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "teams",
    );
    const unsubTeams = onSnapshot(
      qTeams,
      (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        setTeamsState(data);
        teamsLoaded = true;
        checkLoaded();
      },
      (error) => {
        console.error("Error fetching teams:", error);
        teamsLoaded = true;
        checkLoaded();
      },
    );

    // Judges collection instead of single document
    const qJudges = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "judges",
    );
    const unsubJudges = onSnapshot(
      qJudges,
      (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        setJudgesState(data);
        judgesLoaded = true;
        checkLoaded();
      },
      (error) => {
        console.error("Error fetching judges:", error);
        judgesLoaded = true;
        checkLoaded();
      },
    );

    const qControl = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "admin",
      "control_state",
    );
    const unsubControl = onSnapshot(
      qControl,
      (docSnap) => {
        if (docSnap.exists()) setControl(docSnap.data());
      },
      (error) => {
        console.error("Error fetching control state:", error);
      },
    );

    const qEventSettings = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "admin",
      "event_settings",
    );
    const unsubEventSettings = onSnapshot(
      qEventSettings,
      (docSnap) => {
        if (docSnap.exists()) {
          setEventSettings(docSnap.data() || {});
        } else {
          // Don't auto-initialize, just set empty
          setEventSettings({});
        }
        settingsLoaded = true;
        checkLoaded();
      },
      (error) => {
        console.error("Error fetching event settings:", error);
        settingsLoaded = true;
        checkLoaded();
      },
    );

    return () => {
      if (scoresSubscription) scoresSubscription();
      unsubTeams();
      unsubJudges();
      unsubControl();
      unsubEventSettings();
    };
  }, [user]);

  // Action handlers
  const handleUpdateTeams = async (newTeams) => {
    if (!user) {
      alert("Error: You must be logged in to save changes.");
      return;
    }
    setTeamsState(newTeams);
    try {
      const batch = writeBatch(db);
      const teamsRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "teams",
      );

      // Delete existing teams
      const existingTeams = await getDocs(teamsRef);
      existingTeams.forEach((doc) => batch.delete(doc.ref));

      // Add new teams
      newTeams.forEach((team) => {
        const docRef = doc(teamsRef, team.id);
        batch.set(docRef, {
          name: team.name,
          seq: team.seq,
          category: team.category,
          univ: team.univ,
          univ_en: team.univ_en,
          presenter: team.presenter || "",
          topic: team.topic || "",
        });
      });

      await batch.commit();
    } catch (e) {
      console.error("Error updating teams:", e);
      alert("Failed to save team changes.");
    }
  };

  const handleUpdateJudges = async (newJudges) => {
    if (!user) {
      alert("Error: You must be logged in to save changes.");
      return;
    }
    setJudgesState(newJudges);
    try {
      const batch = writeBatch(db);
      const judgesRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "judges",
      );

      // Delete existing judges
      const existingJudges = await getDocs(judgesRef);
      existingJudges.forEach((doc) => batch.delete(doc.ref));

      // Add new judges
      newJudges.forEach((judge) => {
        const docRef = doc(judgesRef, judge.id);
        batch.set(docRef, {
          name: judge.name || "",
          name_en: judge.name_en || "",
          company: judge.company || "",
          assignedCategory: judge.assignedCategory || "",
          assignedCategories: judge.assignedCategories || [],
          assignedTeamIds: judge.assignedTeamIds || [],
          accessCode: judge.accessCode || "",
          // Preserve existing signature if not provided in update
          ...(judge.signature ? { signature: judge.signature } : {}),
        });
      });

      await batch.commit();
    } catch (e) {
      console.error("Error updating judges:", e);
      alert("Failed to save judge changes.");
    }
  };

  const handleSaveJudgeSignature = async (judgeId, signatureData) => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "judges", judgeId),
        { signature: signatureData },
        { merge: true },
      );
      // Update local state
      setJudgesState((prev) =>
        prev.map((j) =>
          j.id === judgeId ? { ...j, signature: signatureData } : j,
        ),
      );
    } catch (e) {
      console.error("Error saving signature:", e);
      throw e;
    }
  };

  const handleUpdateEventSettings = async (newSettings) => {
    if (!user) {
      alert("Error: You must be logged in to save changes.");
      return;
    }
    setEventSettings(newSettings);
    try {
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "admin",
          "event_settings",
        ),
        newSettings,
        { merge: true },
      );
    } catch (e) {
      console.error("Error updating event settings:", e);
      alert("Failed to save event settings.");
    }
  };

  const handleSubmitScore = async (
    teamId,
    detail,
    comment,
    signature,
    judgeProfile,
  ) => {
    if (!user) {
      alert("Error: Not connected to the server.");
      throw new Error("Not authenticated");
    }
    if (!judgeProfile) return;

    try {
      const total = Object.values(detail).reduce((a, b) => a + b, 0);
      const id = `${teamId}_${judgeProfile.id}`;
      const payload = {
        id,
        teamId,
        judgeId: judgeProfile.id,
        judgeName: judgeProfile.name,
        detail,
        total,
        comment,
        signature,
        timestamp: Date.now(),
      };

      setScores((prev) => ({ ...prev, [id]: payload }));

      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "scores", id),
        payload,
        { merge: true },
      );
    } catch (e) {
      console.error("Error saving score:", e);
      // Implement offline support
      const offlineScores =
        JSON.parse(localStorage.getItem("offlineScores")) || [];
      offlineScores.push({ teamId, detail, comment, signature, judgeProfile });
      localStorage.setItem("offlineScores", JSON.stringify(offlineScores));
      alert(
        "You're offline. Score will be synced when connection is restored.",
      );
    }
  };

  const handleControlUpdate = async (newControl) => {
    setControl(newControl);
    try {
      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "admin", "control_state"),
        newControl,
      );
    } catch (e) {
      console.error("Error updating control:", e);
    }
  };

  const handleGlobalLock = async (isLocked) => {
    const newControl = { ...control, globalLock: isLocked, unlockedJudges: [] };
    handleControlUpdate(newControl);
  };

  const handleJudgeUnlock = async (judgeId) => {
    const currentUnlocked = control.unlockedJudges || [];
    let newUnlocked;
    if (currentUnlocked.includes(judgeId)) {
      newUnlocked = currentUnlocked.filter((id) => id !== judgeId);
    } else {
      newUnlocked = [...currentUnlocked, judgeId];
    }
    const newControl = { ...control, unlockedJudges: newUnlocked };
    handleControlUpdate(newControl);
  };

  const handleSystemReset = async () => {
    if (!user) return;

    try {
      // Delete all scores
      const qScores = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "scores",
      );
      const snapshot = await getDocs(qScores);
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      setScores({});

      // Reset teams to empty
      const qTeams = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "teams",
      );
      const teamsSnapshot = await getDocs(qTeams);
      const deleteTeamsPromises = teamsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref),
      );
      await Promise.all(deleteTeamsPromises);
      setTeamsState([]);

      // Reset judges to empty
      const qJudges = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "judges",
      );
      const judgesSnapshot = await getDocs(qJudges);
      const deleteJudgesPromises = judgesSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref),
      );
      await Promise.all(deleteJudgesPromises);
      setJudgesState([]);

      // Reset event settings to defaults (including criteria)

      const defaultCategories = [
        {
          id: "cat_creativity",
          label: "창의성",
          label_en: "Creativity",
          max: 30,
        },
        {
          id: "cat_market",
          label: "시장성",
          label_en: "Marketability",
          max: 40,
        },
        {
          id: "cat_business",
          label: "사업성",
          label_en: "Feasibility",
          max: 30,
        },
      ];

      const nestedCategories = defaultCategories.map((cat) => ({
        ...cat,
        maxPoints: cat.max,
        items: CRITERIA.filter((i) => i.category === cat.id),
      }));

      const defaultEventSettings = {
        criteria: {
          categories: nestedCategories,
        },
        scoringMethod: "avg",
        voteMode: "none",
        voteRatio: { judge: 70, audience: 30 },
        rankBonus: { 1: 5, 2: 3, 3: 1, other: 0 },
      };

      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "admin",
          "event_settings",
        ),
        defaultEventSettings,
      );
      setEventSettings(defaultEventSettings);

      // Reset control state
      const defaultControl = {
        activeTeamId: null,
        globalLock: false,
        unlockedJudges: [],
        timer: { isRunning: false, seconds: 420 },
      };
      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "admin", "control_state"),
        defaultControl,
      );
      setControl(defaultControl);

      alert("System has been reset successfully.");
    } catch (e) {
      console.error("Error resetting system:", e);
      alert("Failed to reset system.");
    }
  };

  // Optimized score subscription based on judge profile
  useEffect(() => {
    if (!user || !judges.length) return;

    // Find current judge profile from judges
    const currentJudge =
      judges.find((j) => j.id === user.uid) ||
      judges.find((j) => j.email === user.email);

    if (!currentJudge) return;

    // Subscribe only to scores where judgeId matches current judge
    const scoresQuery = query(
      collection(db, "artifacts", appId, "public", "data", "scores"),
      where("judgeId", "==", currentJudge.id),
    );

    const unsub = onSnapshot(
      scoresQuery,
      (snapshot) => {
        const data = {};
        snapshot.forEach((doc) => {
          const scoreData = doc.data();
          const id = `${scoreData.teamId}_${scoreData.judgeId}`;
          data[id] = scoreData;
        });
        setScores(data);
      },
      (error) => {
        console.error("Error fetching scores:", error);
      },
    );

    return unsub;
  }, [user, judges]);

  const handleResetScores = async () => {
    if (!user) return;

    try {
      // Delete all scores
      const qScores = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "scores",
      );
      const snapshot = await getDocs(qScores);
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      setScores({});

      alert("Scores have been reset successfully.");
    } catch (e) {
      console.error("Error resetting scores:", e);
      alert("Failed to reset scores.");
    }
  };

  const value = {
    // State
    user,
    isLoading,
    teams,
    judges,
    eventSettings,
    scores,
    control,
    isOnline,
    // Actions
    setTeams: handleUpdateTeams,
    setJudges: handleUpdateJudges,
    onUpdateEventSettings: handleUpdateEventSettings,
    onSubmitScore: handleSubmitScore,
    onControlUpdate: handleControlUpdate,
    onGlobalLock: handleGlobalLock,
    onJudgeUnlock: handleJudgeUnlock,
    onGlobalLock: handleGlobalLock,
    onJudgeUnlock: handleJudgeUnlock,
    onSystemReset: handleSystemReset,
    onScoresReset: handleResetScores,
    saveJudgeSignature: handleSaveJudgeSignature,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export default DataContext;
