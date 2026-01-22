import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  Trophy,
  X,
  MonitorPlay,
  Unlock,
  Calculator,
  Timer,
  Pause,
  Play,
  Activity,
  LogOut,
  AlertTriangle,
  Crown,
  Medal,
  Download,
  Users,
  Lock,
  Settings,
  PenTool,
} from "lucide-react";
import { AppContext } from "../context";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { SettingsBar, GlassCard } from "../components/ui";
import { TeamDetailModal } from "../components/modals";
import { TeamManagement } from "../components/TeamManagement";
import { JudgeManagement } from "../components/JudgeManagement";
import { EventSettings } from "../components/EventSettings";
import { CriteriaManager } from "../components/CriteriaManager";
import { ScoringSettings } from "../components/ScoringSettings";
import { calculateFinalScore } from "../utils/scoring";

const AdminDashboard = () => {
  const { t, lang } = useContext(AppContext);
  const {
    teams,
    setTeams,
    judges,
    setJudges,
    eventSettings,
    onUpdateEventSettings,
    onSystemReset,
    scores,
    control,
    onControlUpdate,
    onGlobalLock,
    onJudgeUnlock,
  } = useData();
  const { logout } = useAuth();

  const [mode, setMode] = useState("DASHBOARD");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const stats = useMemo(() => {
    const totalVotes = Object.keys(scores).length;
    const progress = Math.round(
      (totalVotes / (teams.length * judges.length)) * 100,
    );

    const teamJudgedData = teams.map((t) => {
      const tScores = judges
        .map((j) => scores[`${t.id}_${j.id}`])
        .filter(Boolean);
      const scoresList = tScores.map((s) => s.total);

      let bizScore = 0,
        mktScore = 0,
        creScore = 0;
      tScores.forEach((s) => {
        Object.entries(s.detail).forEach(([k, v]) => {
          if (k.startsWith("b")) bizScore += v;
          if (k.startsWith("m")) mktScore += v;
          if (k.startsWith("c")) creScore += v;
        });
      });

      let judgeAvg = 0;

      if (scoresList.length > 0) {
        const method = eventSettings?.scoringMethod || "avg";
        judgeAvg = calculateFinalScore(scoresList, method);
      }

      return {
        ...t,
        judgeAvg,
        bizScore,
        mktScore,
        creScore,
        count: tScores.length,
      };
    });

    const finalRanking = teamJudgedData.sort((a, b) => {
      if (b.judgeAvg !== a.judgeAvg) return b.judgeAvg - a.judgeAvg;
      if (b.bizScore !== a.bizScore) return b.bizScore - a.bizScore;
      if (b.mktScore !== a.mktScore) return b.mktScore - a.mktScore;
      return b.creScore - a.creScore;
    });

    return { progress, totalVotes, teamStats: finalRanking };
  }, [teams, scores, judges, eventSettings]);

  const downloadCSV = () => {
    const headers = [
      "Rank",
      "Category",
      "Team Name",
      "University",
      "Presenter",
      "Final Score (Avg)",
      ...judges.map((j) => `Judge: ${j.name}`),
      "Creativity Score",
      "Market Score",
      "Business Score",
      "Judge Count",
    ];

    const rankedTeams = stats.teamStats.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

    const sortedRows = rankedTeams.sort(
      (a, b) => Number(a.seq) - Number(b.seq),
    );

    const rows = sortedRows.map((team) => {
      const judgeScores = judges.map((j) => {
        const s = scores[`${team.id}_${j.id}`];
        return s ? s.total : "-";
      });

      return [
        team.rank,
        `"${team.category || ""}"`,
        `"${team.name}"`,
        `"${team.univ}"`,
        `"${team.presenter}"`,
        team.judgeAvg.toFixed(2),
        ...judgeScores,
        team.creScore,
        team.mktScore,
        team.bizScore,
        team.count,
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
      `evaluation_results_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Timer Logic
  const toggleTimer = () => {
    const currentTimer = control?.timer || { isRunning: false, seconds: 0 };
    onControlUpdate({
      ...control,
      timer: { ...currentTimer, isRunning: !currentTimer.isRunning },
    });
  };

  const resetTimer = () => {
    const minutes = eventSettings?.timerPresentation || 7;
    onControlUpdate({
      ...control,
      timer: { isRunning: false, seconds: minutes * 60 },
    });
  };

  useEffect(() => {
    let interval;
    if (control?.timer?.isRunning && control.timer.seconds > 0) {
      interval = setInterval(() => {
        onControlUpdate({
          ...control,
          timer: { ...control.timer, seconds: control.timer.seconds - 1 },
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [control?.timer?.isRunning, control?.timer?.seconds]);

  useEffect(() => {
    if (!control?.timer?.isRunning && eventSettings?.timerPresentation) {
      const newSeconds = eventSettings.timerPresentation * 60;
      if (control?.timer?.seconds !== newSeconds) {
        onControlUpdate({
          ...control,
          timer: { ...control.timer, seconds: newSeconds },
        });
      }
    }
  }, [eventSettings?.timerPresentation]);

  if (mode === "CEREMONY") {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black animate-pulse-slow" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

        <button
          onClick={() => setMode("DASHBOARD")}
          className="absolute top-8 right-8 z-50 p-3 bg-white/5 rounded-full hover:bg-white/20 cursor-pointer backdrop-blur-sm transition-all hover:scale-110"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="z-10 text-center space-y-12 animate-in zoom-in duration-1000 flex flex-col items-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-sm font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)]">
            <Trophy className="w-5 h-5" /> {t.grand_prix}
          </div>

          <div className="space-y-4">
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white via-white to-slate-500 drop-shadow-2xl">
              {stats.teamStats[0]?.name}
            </h1>
            <div className="text-3xl text-slate-400 font-light tracking-wide">
              {lang === "en"
                ? stats.teamStats[0]?.univ_en
                : stats.teamStats[0]?.univ}
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center relative">
            <div className="absolute -inset-10 bg-linear-to-t from-yellow-500/20 to-transparent blur-3xl rounded-full" />
            <div className="text-sm text-yellow-500/80 mb-4 uppercase tracking-[0.3em] font-bold">
              {t.final_score_label}
            </div>
            <div className="text-[10rem] leading-none font-black text-white select-none font-mono tabular-nums tracking-tighter drop-shadow-[0_0_60px_rgba(255,255,255,0.3)]">
              {stats.teamStats[0]?.judgeAvg.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans p-6 text-slate-900 transition-colors duration-500 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-b from-blue-50 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/40 blur-[100px] rounded-full pointer-events-none" />

      <TeamDetailModal
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        team={selectedTeam}
        judges={judges}
        scores={scores}
        eventSettings={eventSettings}
      />

      <header className="relative flex flex-col lg:flex-row justify-between items-center mb-6 px-2 z-10 shrink-0 gap-4 lg:gap-0">
        <div className="w-full lg:w-auto flex flex-col items-center lg:items-start">
          <div className="flex items-center gap-3 mb-2">
            <img src="/conkkong-logo.svg" className="w-8 h-8" alt="Logo" />
            <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-slate-600 drop-shadow-sm">
              {t.mission_control}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-slate-200/60 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
              {t.system_status}
            </span>
            {control?.activeTeamId && (
              <span className="flex items-center gap-2 px-3 py-1 bg-blue-50 backdrop-blur-sm rounded-full shadow-sm border border-blue-100 text-blue-600">
                <MonitorPlay className="w-3 h-3" />
                <span className="opacity-70">{t.current_presenting}:</span>
                <span className="font-bold">
                  {teams.find((t) => t.id === control.activeTeamId)?.name}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Tab Navigation */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-xl gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "dashboard" ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <Activity className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "teams" ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <Users className="w-4 h-4" /> Teams
          </button>
          <button
            onClick={() => setActiveTab("judges")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "judges" ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <Users className="w-4 h-4" /> Judges
          </button>
          <button
            onClick={() => setActiveTab("event")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "event" ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <Settings className="w-4 h-4" /> Event
          </button>
          <button
            onClick={() => setActiveTab("judging_criteria")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "judging_criteria" ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <PenTool className="w-4 h-4" /> Criteria
          </button>
          <button
            onClick={() => setActiveTab("judge_scoring")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "judge_scoring" ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <Calculator className="w-4 h-4" /> Scoring
          </button>
        </div>

        <div className="flex gap-3 items-center flex-wrap justify-center w-full lg:w-auto">
          <SettingsBar />

          {/* Timer Control */}
          <div className="bg-white rounded-2xl p-1.5 flex items-center gap-3 border border-slate-200 shadow-sm pr-2">
            <div className="bg-slate-100 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Timer className="w-4 h-4 text-slate-500" />
              <span
                className={`font-mono font-bold text-xl w-[4.5ch] text-center ${control?.timer?.seconds < 60 && control?.timer?.isRunning ? "text-red-500" : "text-slate-700"}`}
              >
                {Math.floor((control?.timer?.seconds || 0) / 60)}:
                {String((control?.timer?.seconds || 0) % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={toggleTimer}
                className={`p-2 rounded-xl transition-all cursor-pointer ${control?.timer?.isRunning ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}
              >
                {control?.timer?.isRunning ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>
              <button
                onClick={resetTimer}
                className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1" />

          {/* Global Controls Group */}
          <div className="flex bg-white rounded-2xl p-1 border border-slate-200 shadow-sm">
            <button
              onClick={() => onGlobalLock(!control?.globalLock)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${control?.globalLock ? "bg-red-50 text-red-600 hover:bg-red-100" : "text-slate-500 hover:bg-slate-50"}`}
              title={t.global_lock}
            >
              {control?.globalLock ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </button>
            <div className="w-px bg-slate-100 my-1" />
            <button
              onClick={() => setMode("CEREMONY")}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-2 cursor-pointer"
              title={t.mode_ceremony}
            >
              <Trophy className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={logout}
            className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors cursor-pointer shadow-sm"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-1 gap-6 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        {activeTab === "teams" ? (
          <div className="col-span-12 h-full overflow-hidden">
            <TeamManagement teams={teams} setTeams={setTeams} />
          </div>
        ) : activeTab === "judges" ? (
          <div className="col-span-12 h-full overflow-hidden">
            <JudgeManagement judges={judges} setJudges={setJudges} />
          </div>
        ) : activeTab === "event" ? (
          <div className="col-span-12 h-full overflow-hidden">
            <EventSettings
              settings={eventSettings}
              onSave={onUpdateEventSettings}
              onReset={onSystemReset}
            />
          </div>
        ) : activeTab === "judging_criteria" ? (
          <div className="col-span-12 h-full overflow-hidden">
            <CriteriaManager
              settings={eventSettings}
              onSave={onUpdateEventSettings}
            />
          </div>
        ) : activeTab === "judge_scoring" ? (
          <div className="col-span-12 h-full overflow-hidden">
            <ScoringSettings
              settings={eventSettings}
              onSave={onUpdateEventSettings}
            />
          </div>
        ) : (
          <>
            {/* Left Col: Field Control */}
            <div className="col-span-1 lg:col-span-3 flex flex-col gap-6 shrink-0">
              {/* Field Op 1: Active Team Control */}
              <GlassCard className="flex-1 p-0 flex flex-col overflow-hidden border-slate-200/60 shadow-lg">
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <MonitorPlay className="w-4 h-4 text-blue-500" />{" "}
                    {t.force_sync}
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() =>
                        onControlUpdate({ ...control, activeTeamId: team.id })
                      }
                      className={`w-full p-3 text-left rounded-xl text-sm font-bold flex justify-between items-center transition-all duration-300 group
                        ${
                          control?.activeTeamId === team.id
                            ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-[1.02]"
                            : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100 hover:border-slate-200"
                        }
                       cursor-pointer`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full ${control?.activeTeamId === team.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}
                        >
                          {team.seq}
                        </span>
                        {team.name}
                      </span>
                      {control?.activeTeamId === team.id && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
                      )}
                    </button>
                  ))}
                </div>
              </GlassCard>

              {/* Field Op 2: Judge Status */}
              <GlassCard className="h-[300px] p-0 flex flex-col overflow-hidden border-slate-200/60 shadow-lg">
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />{" "}
                    {t.judge_status}
                  </h4>
                  {control?.globalLock && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> {t.locked}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {judges.map((judge) => {
                    const isUnlocked = control?.unlockedJudges?.includes(
                      judge.id,
                    );
                    const isLocked = control?.globalLock && !isUnlocked;

                    const completedCount = Object.keys(scores).filter((k) =>
                      k.includes(judge.id),
                    ).length;
                    const progress = Math.round(
                      (completedCount / teams.length) * 100,
                    );

                    return (
                      <div
                        key={judge.id}
                        className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm"
                      >
                        <div className="flex flex-col min-w-0 flex-1 mr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-700 truncate">
                              {judge.name}
                            </span>
                            {isLocked ? (
                              <Lock className="w-3 h-3 text-red-400" />
                            ) : (
                              <Unlock className="w-3 h-3 text-slate-300" />
                            )}
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {control?.globalLock && (
                          <button
                            onClick={() => onJudgeUnlock(judge.id)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer border ${isUnlocked ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                          >
                            {isUnlocked ? t.btn_lock : t.btn_unlock}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>

            {/* Center: Leaderboard */}
            <div className="col-span-1 lg:col-span-9 h-[600px] lg:h-full pb-6 lg:pb-0">
              <GlassCard className="h-full flex flex-col p-0 overflow-hidden border-slate-200/60 shadow-xl">
                <div className="p-5 border-b border-slate-100 bg-white/80 backdrop-blur-md flex justify-between items-center sticky top-0 z-20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Trophy className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wide text-slate-700">
                        {t.live_ranking}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Real-time scoring updates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadCSV}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-colors cursor-pointer shadow-sm flex items-center gap-2 text-xs font-bold"
                      title="Download CSV"
                    >
                      <Download className="w-3 h-3" /> CSV
                    </button>
                    <div className="text-[10px] font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-200">
                      <Calculator className="w-3 h-3" /> {t.ranking_calc}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 border-b border-slate-100 p-3 grid grid-cols-[auto_1fr_auto] md:grid-cols-12 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-[73px] z-10 backdrop-blur-sm gap-2 md:gap-0">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-1 md:col-span-6 pl-4">{t.team}</div>
                  <div className="hidden md:block md:col-span-3 text-center">
                    {t.judge_progress}
                  </div>
                  <div className="col-span-1 md:col-span-2 text-right pr-6">
                    {t.total_score}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/30">
                  {stats.teamStats.map((team, idx) => {
                    const isTop3 = idx < 3;
                    const rankColor =
                      idx === 0
                        ? "bg-yellow-400 text-yellow-900 ring-4 ring-yellow-400/20"
                        : idx === 1
                          ? "bg-slate-300 text-slate-800"
                          : idx === 2
                            ? "bg-amber-600 text-amber-100"
                            : "bg-slate-100 text-slate-500";

                    return (
                      <div
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className={`grid grid-cols-[auto_1fr_auto] md:grid-cols-12 items-center p-4 rounded-2xl transition-all duration-300 group cursor-pointer border
                            ${isTop3 ? "bg-white shadow-md border-slate-100 hover:-translate-y-0.5 hover:shadow-lg" : "bg-white/50 border-transparent hover:bg-white hover:shadow-sm"}
                          `}
                      >
                        <div className="col-span-1 flex justify-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${rankColor}`}
                          >
                            {idx === 0 ? (
                              <Crown className="w-4 h-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                        </div>
                        <div className="col-span-1 md:col-span-6 pl-4 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`font-bold text-base truncate ${idx === 0 ? "text-slate-900" : "text-slate-700"}`}
                            >
                              {team.name}
                            </span>
                            {idx < 3 && (
                              <Medal
                                className={`w-3 h-3 ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : "text-amber-600"}`}
                              />
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate flex items-center gap-2">
                            <span className="font-medium text-slate-500">
                              {lang === "en" ? team.univ_en : team.univ}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{team.presenter}</span>
                          </div>
                        </div>
                        <div className="hidden md:flex md:col-span-3 flex-col items-center justify-center gap-1.5">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-500 rounded-full"
                              style={{
                                width: `${(team.count / judges.length) * 100}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-bold ${team.count === judges.length ? "text-green-500" : "text-slate-400"}`}
                          >
                            {team.count} / {judges.length} Judges
                          </span>
                        </div>
                        <div className="col-span-1 md:col-span-2 text-right pr-6">
                          <div
                            className={`text-2xl font-mono font-black tracking-tight ${idx === 0 ? "text-indigo-600" : "text-slate-700"}`}
                          >
                            {team.judgeAvg.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
