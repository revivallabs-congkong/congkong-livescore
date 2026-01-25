import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  CalendarClock,
  MapPin,
  Command,
  ChevronRight,
  Lock,
} from "lucide-react";
import { AppContext } from "../context";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { SettingsBar, GlassCard } from "../components/ui";
import { AdminLoginModal } from "../components/modals";

const LoginScreen = () => {
  const { t } = useContext(AppContext);
  const { judges, eventSettings, isLoading } = useData();
  const { login } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState(null);
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  const handleJudgeClick = (judge) => {
    setSelectedJudge(judge);
    setAccessCode("");
    setError("");
  };

  const handleJudgeLogin = (e) => {
    e.preventDefault();
    if (!selectedJudge) return;

    if (!selectedJudge.accessCode) {
      setError("System Error: No Access Code found. Contact Admin.");
      return;
    }

    if (accessCode === selectedJudge.accessCode) {
      login(selectedJudge);
    } else {
      setError("Invalid Access Code");
    }
  };

  const handleAdminLogin = () => {
    login({ id: "admin", name: "운영본부", role: "admin" });
  };

  // Show loading spinner while data is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#F2F2F7]  flex items-center justify-center p-6 font-sans selection:bg-blue-500/30 transition-colors duration-500">
      <AdminLoginModal
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
        onLogin={handleAdminLogin}
      />

      <div className="absolute top-6 right-6 z-50">
        <SettingsBar />
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white  border border-slate-200  text-xs font-bold uppercase tracking-widest mb-6 shadow-sm text-slate-600 ">
              <img src="/conkkong-logo.svg" className="w-4 h-4" alt="Logo" />{" "}
              LiveScore Titanium Edition
            </div>
            <h1 className="text-5xl lg:text-6xl font-semibold tracking-tighter text-slate-900  mb-6 leading-tight break-keep">
              {eventSettings?.mainTitle || t.app_title}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
                {eventSettings?.description || t.app_subtitle}
              </span>
            </h1>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200  flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-slate-700 " />
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold">
                  {t.date_label}
                </div>
                <div className="text-sm font-semibold ">
                  {eventSettings?.eventTime || t.date_val}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200  flex items-center justify-center">
                <MapPin className="w-5 h-5 text-slate-700 " />
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold">
                  {t.loc_label}
                </div>
                <div className="text-sm font-semibold ">
                  {eventSettings?.location || t.loc_val}
                </div>
              </div>
            </div>
          </div>
        </div>

        <GlassCard className="p-8 h-[600px] flex flex-col shadow-2xl border-white/60 ">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-xl font-bold text-slate-900 ">
              {t.login_judge}
            </h2>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
              <Command className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {judges.map((judge) => (
              <button
                key={judge.id}
                onClick={() => handleJudgeClick(judge)}
                className="w-full group flex items-center gap-4 p-3 rounded-[20px] hover:bg-slate-100  transition-all duration-300 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-slate-100 to-slate-200   flex items-center justify-center font-bold text-slate-600  shadow-inner group-hover:scale-105 transition-transform">
                  {judge.name[0]}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-base text-slate-800  group-hover:text-blue-600 transition-colors">
                    {judge.name}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {judge.company} {judge.position}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 ">
            <button
              onClick={() => setShowAdmin(true)}
              className="w-full py-3 rounded-xl border border-dashed border-slate-300  text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50  transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-3 h-3" /> {t.login_admin}
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Judge PIN Modal */}
      {selectedJudge && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Enter Access Code
            </h3>
            <p className="text-slate-500 mb-6 text-sm">
              Please enter the 4-digit PIN for <b>{selectedJudge.name}</b>.
            </p>

            <form onSubmit={handleJudgeLogin}>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  setError("");
                }}
                className="w-full p-3 text-center text-2xl tracking-[0.5em] font-bold border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder="••••"
                maxLength={4}
                autoFocus
              />

              {error && (
                <p className="text-red-500 text-sm text-center font-medium mb-4 animate-in slide-in-from-top-1">
                  {error}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedJudge(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
