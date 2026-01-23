import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  LogOut,
  MonitorPlay,
  PenTool,
  Sparkles,
  Crown,
  Download,
  Search,
} from "lucide-react";
import { AppContext } from "../context";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import {
  SettingsBar,
  GlassCard,
  AppleSlider,
  DynamicIsland,
  ToastMessage,
} from "../components/ui";
import { ConfirmSubmitModal, SignatureModal } from "../components/modals";
import { CRITERIA } from "../data";

const JudgeInterface = () => {
  const { t, lang } = useContext(AppContext);
  const {
    teams,
    scores,
    control,
    eventSettings,
    isOnline,
    onSubmitScore,
    isLoading,
  } = useData();
  const { userProfile, logout } = useAuth();

  const judge = userProfile;

  const [activeTeamId, setActiveTeamId] = useState(teams[0]?.id);
  const [localScore, setLocalScore] = useState({});
  const [memo, setMemo] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [showToast, setShowToast] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Debounce Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // 300ms debounce
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Derive Criteria from Settings or Fallback
  const criteriaData = useMemo(() => {
    if (eventSettings?.criteria?.categories) {
      return eventSettings.criteria.categories;
    }
    return [];
  }, [eventSettings]);

  const allCriteriaItems = useMemo(() => {
    if (criteriaData.length > 0) {
      return criteriaData.flatMap((cat) =>
        cat.items.map((item) => ({ ...item, category: cat.id })),
      );
    }
    return CRITERIA;
  }, [criteriaData]);

  // Filter teams by judge's assigned category
  const assignedTeams = useMemo(() => {
    if (!judge) return teams;

    // Priority 1: Specific team IDs assigned
    if (judge.assignedTeamIds?.length > 0) {
      return teams.filter((t) => judge.assignedTeamIds.includes(t.id));
    }

    // Priority 2: Category assignment (Multi or Single)
    const assignedCats = [];
    if (Array.isArray(judge.assignedCategories)) {
      assignedCats.push(...judge.assignedCategories);
    } else if (judge.assignedCategory) {
      // Backward compatibility
      assignedCats.push(judge.assignedCategory);
    }

    if (assignedCats.length > 0) {
      return teams.filter((t) => assignedCats.includes(t.category));
    }

    // Fallback: Show all (backward compatibility)
    return teams;
  }, [teams, judge]);

  // Extract unique categories from assigned teams for filter chips
  const availableCategories = useMemo(() => {
    const cats = new Set(assignedTeams.map((t) => t.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [assignedTeams]);

  // Apply Search & Category Filters
  const displayTeams = useMemo(() => {
    let result = assignedTeams;

    // 1. Category Filter
    if (selectedCategory !== "ALL") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // 2. Search Filter (Team Name, Presenter, Univ)
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.presenter?.toLowerCase().includes(q) ||
          t.univ?.toLowerCase().includes(q) ||
          t.univ_en?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [assignedTeams, selectedCategory, debouncedQuery]);

  // Sync active team
  useEffect(() => {
    if (control?.activeTeamId) setActiveTeamId(control.activeTeamId);
  }, [control?.activeTeamId]);

  // Set initial activeTeamId when teams load
  useEffect(() => {
    // If no active team is selected, select the first one from the display list (or assigned list)
    if (assignedTeams.length > 0 && !activeTeamId) {
      setActiveTeamId(assignedTeams[0].id);
    }
  }, [assignedTeams, activeTeamId]);

  const activeTeam =
    assignedTeams.find((t) => t.id === activeTeamId) || assignedTeams[0];
  const currentKey = judge ? `${activeTeamId}_${judge.id}` : null;
  const savedData = currentKey ? scores[currentKey] : null;

  const isGlobalLock = control?.globalLock;
  const isUnlocked = judge && control?.unlockedJudges?.includes(judge.id);
  const isLocked = isGlobalLock && !isUnlocked;

  useEffect(() => {
    if (savedData) {
      setLocalScore(savedData.detail);
      setMemo(savedData.comment || "");
    } else {
      const init = {};
      allCriteriaItems.forEach((c) => (init[c.id] = 0));
      setLocalScore(init);
      setMemo("");
    }
  }, [activeTeamId, savedData, allCriteriaItems]);

  const handleScoreChange = (id, val) => {
    if (isLocked) return;
    setLocalScore((prev) => ({ ...prev, [id]: val }));
  };
  const totalScore = Object.values(localScore).reduce((a, b) => a + b, 0);

  const handlePreSubmit = () => {
    if (isLocked) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    setIsConfirmOpen(false);
    setIsSignatureOpen(true);
  };

  const handleSignatureSubmit = async (signatureData) => {
    setIsSignatureOpen(false);
    setSaveStatus("saving");
    await onSubmitScore(activeTeamId, localScore, memo, signatureData, judge);
    setSaveStatus("saved");
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setSaveStatus("idle");
    }, 2000);
  };

  const zeroItems = allCriteriaItems.filter(
    (c) => (localScore[c.id] || 0) === 0,
  );

  const downloadMyScores = () => {
    if (!judge) return;
    const headers = [
      "Team Sequence",
      "Team Name",
      "University",
      "Presenter",
      "Total Score",
      ...allCriteriaItems.map((c) => (lang === "en" ? c.label_en : c.label)),
      "Comment",
    ];

    const rows = teams.map((team) => {
      const s = scores[`${team.id}_${judge.id}`];
      const detail = s ? s.detail : {};
      const criteriaScores = allCriteriaItems.map((c) => detail[c.id] || 0);

      return [
        team.seq,
        `"${team.name}"`,
        `"${lang === "en" ? team.univ_en : team.univ}"`,
        `"${team.presenter}"`,
        s ? s.total : 0,
        ...criteriaScores,
        `"${s ? (s.comment || "").replace(/"/g, '""') : ""}"`,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `my_scores_${judge.name}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show loading spinner while data is loading
  if (isLoading || !judge || !activeTeam) {
    return (
      <div className="h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">
            {t?.loading || "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F5F5F7]  text-slate-900  font-sans overflow-hidden flex flex-col selection:bg-blue-500/30 transition-colors duration-500">
      <ConfirmSubmitModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        totalScore={totalScore}
        zeroItems={zeroItems}
      />

      <SignatureModal
        isOpen={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
        onSave={handleSignatureSubmit}
      />

      <ToastMessage message={t.toast_saved} isVisible={showToast} />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden px-4 pb-4 gap-4 mt-5">
        {/* Sidebar */}
        <div className="w-full lg:w-[300px] h-[280px] lg:h-auto shrink-0 bg-white/80 backdrop-blur-xl rounded-[24px] flex flex-col border border-white/20 shadow-sm z-20">
          <div className="p-5 border-b border-slate-100 ">
            <div className="flex items-center gap-2 mb-6 opacity-50 justify-between">
              <div className="flex items-center gap-2">
                <img src="/conkkong-logo.svg" className="w-4 h-4" alt="Logo" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  LiveScore
                </span>
              </div>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isOnline ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                {isOnline ? t.status_online : t.status_offline}
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                {judge.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">
                  {lang === "en" ? judge.name_en || judge.name : judge.name}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {judge.company}
                </div>
              </div>
              <button
                onClick={downloadMyScores}
                className="cursor-pointer mr-2"
                title={t.btn_download_csv}
              >
                <Download className="w-4 h-4 text-slate-400 hover:text-blue-500" />
              </button>
              <button onClick={logout} className="cursor-pointer">
                <LogOut className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>
            <div className="h-1 bg-slate-100  rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{
                  width: `${(Object.keys(scores).filter((k) => k.includes(judge.id)).length / assignedTeams.length) * 100}%`,
                }}
              />
            </div>
            {(judge.assignedCategory ||
              (judge.assignedCategories &&
                judge.assignedCategories.length > 0)) && (
              <div className="mt-2 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-center font-bold truncate">
                {judge.assignedCategories?.length > 1
                  ? `${judge.assignedCategories.length} Categories`
                  : judge.assignedCategories?.[0] || judge.assignedCategory}
                ({assignedTeams.length} teams)
              </div>
            )}

            {/* Search & Filter Controls */}
            <div className="mt-4 space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.search_placeholder || "Search Team..."}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Category Chips */}
              {availableCategories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      selectedCategory === "ALL"
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {t.filter_all || "All"}
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {displayTeams.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No teams found
              </div>
            ) : (
              displayTeams.map((team) => {
                const scoreData = scores[`${team.id}_${judge.id}`];
                const isDone = !!scoreData;
                const isActive = activeTeamId === team.id;
                const isGlobalActive = control?.activeTeamId === team.id;

                return (
                  <button
                    key={team.id}
                    onClick={() => setActiveTeamId(team.id)}
                    className={`w-full p-3 rounded-[16px] text-left transition-all duration-200 relative group
                    ${isActive ? "bg-white  shadow-sm" : "hover:bg-black/5 "}
                    ${isGlobalActive && !isActive ? "ring-1 ring-blue-500/50 ring-dashed" : ""}
                   cursor-pointer`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        {isGlobalActive && (
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"
                            title={t.current_presenting}
                          />
                        )}
                        <span
                          className={`font-bold text-xs ${isActive ? "text-blue-600" : ""}`}
                        >
                          {team.name}
                        </span>
                        {team.category && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {team.category}
                          </span>
                        )}
                      </div>
                      {isDone && (
                        <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50  px-1.5 py-0.5 rounded flex items-center gap-1">
                          {scoreData.total}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {team.topic}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 bg-white/50  backdrop-blur-md rounded-[24px] border border-white/20 shadow-sm overflow-hidden relative">
          <div className="p-6 pb-0 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {activeTeam.name}
                </h1>
                {control?.activeTeamId === activeTeamId && (
                  <span className="bg-red-100 text-red-600   px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse flex items-center gap-1">
                    <MonitorPlay className="w-3 h-3" /> LIVE
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
                {activeTeam.category && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                    {activeTeam.category}
                  </span>
                )}
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold  ">
                  {lang === "en" ? activeTeam.univ_en : activeTeam.univ}
                </span>
                {activeTeam.topic}
              </div>
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <SettingsBar />
              <div className="px-3 py-1 bg-slate-100  rounded-full text-xs font-bold text-slate-500">
                {activeTeam?.seq} / {assignedTeams.length}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pb-24 scroll-smooth">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {criteriaData.length > 0
                  ? criteriaData.map((cat) => (
                      <GlassCard key={cat.id} className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div
                            className={`w-1 h-4 rounded-full ${cat.id === "cat_creativity" ? "bg-blue-500" : cat.id === "cat_market" ? "bg-purple-500" : "bg-amber-500"}`}
                          />
                          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            {lang === "en" ? cat.label_en : cat.label}
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {cat.items.map((crit) => (
                            <AppleSlider
                              key={crit.id}
                              label={lang === "en" ? crit.label_en : crit.label}
                              desc={crit.desc}
                              max={crit.max}
                              value={localScore[crit.id] || 0}
                              onChange={(val) =>
                                handleScoreChange(crit.id, val)
                              }
                              disabled={isLocked}
                            />
                          ))}
                        </div>
                      </GlassCard>
                    ))
                  : Object.entries(
                      CRITERIA.reduce((groups, c) => {
                        if (!groups[c.category]) groups[c.category] = [];
                        groups[c.category].push(c);
                        return groups;
                      }, {}),
                    ).map(([category, items]) => (
                      <GlassCard key={category} className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-4 rounded-full bg-slate-300" />
                          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            {t[category]}
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {items.map((crit) => (
                            <AppleSlider
                              key={crit.id}
                              label={lang === "en" ? crit.label_en : crit.label}
                              desc={crit.desc}
                              max={crit.max}
                              value={localScore[crit.id] || 0}
                              onChange={(val) =>
                                handleScoreChange(crit.id, val)
                              }
                              disabled={isLocked}
                            />
                          ))}
                        </div>
                      </GlassCard>
                    ))}
              </div>

              <div className="space-y-6">
                <GlassCard className="p-5 flex flex-col h-[280px]">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-blue-500" />{" "}
                      {t.comment_placeholder}
                    </h3>
                    <button
                      onClick={() => setShowAI(!showAI)}
                      className="text-[10px] bg-slate-100  px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-blue-50  hover:text-blue-500 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> {t.ai_analysis}
                    </button>
                  </div>
                  {showAI && (
                    <div className="mb-3 p-3 bg-blue-50  rounded-xl text-xs text-blue-700  animate-in slide-in-from-top-2">
                      <strong>{t.ai_insight}:</strong> {t.ai_msg}
                    </div>
                  )}
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder={t.comment_placeholder}
                    disabled={isLocked}
                    className={`flex-1 w-full p-4 bg-transparent border-none focus:ring-0 text-sm resize-none placeholder:text-slate-300 leading-relaxed ${isLocked ? "cursor-not-allowed text-slate-400" : ""}`}
                  />
                </GlassCard>

                <div
                  className={`p-6 rounded-[24px] text-white shadow-xl flex items-center justify-between relative overflow-hidden transition-all duration-300 ${isLocked ? "bg-slate-400 grayscale" : "bg-linear-to-br from-blue-600 to-indigo-700"}`}
                >
                  <div className="relative z-10">
                    <div className="text-xs font-bold opacity-70 uppercase mb-1">
                      {t.score_total}
                    </div>
                    <div className="text-5xl font-black tracking-tighter">
                      {totalScore}
                    </div>
                  </div>
                  <button
                    onClick={handlePreSubmit}
                    disabled={isLocked}
                    className={`relative z-10 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95 cursor-pointer"}`}
                  >
                    {isLocked ? "Locked" : savedData ? t.update : t.submit}
                  </button>
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
                    <Crown className="w-32 h-32" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default JudgeInterface;
