import React, { useContext, useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  X,
  AlertCircle,
  ShieldCheck,
  Lock,
  Key,
  Eye,
  EyeOff,
  ClipboardList,
  Check,
} from "lucide-react";
import { AppContext } from "../context";

// Submit Confirmation Modal
export const ConfirmSubmitModal = ({
  isOpen,
  onClose,
  onConfirm,
  totalScore,
  zeroItems,
}) => {
  const { t, lang } = useContext(AppContext);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white  w-[90%] max-w-[400px] rounded-[32px] p-8 shadow-2xl border border-white/10 animate-in zoom-in-95">
        <h3 className="text-2xl font-bold mb-2 text-center text-slate-900 ">
          {t.confirm_title}
        </h3>

        <div className="my-6 text-center">
          <div className="text-sm text-slate-500 mb-1">{t.confirm_msg}</div>
          <div className="text-6xl font-black text-blue-600  tracking-tighter">
            {totalScore}
          </div>
          <div className="text-sm text-slate-400 mt-2">pts</div>
        </div>

        {zeroItems.length > 0 && (
          <div className="bg-red-50  p-4 rounded-xl border border-red-100  mb-6">
            <div className="flex items-center gap-2 text-red-600  font-bold text-sm mb-2">
              <AlertTriangle className="w-4 h-4" /> {t.confirm_warn_title}
            </div>
            <div className="text-xs text-slate-600 ">
              {zeroItems
                .map((item) => (lang === "en" ? item.label_en : item.label))
                .join(", ")}{" "}
              {t.confirm_warn_desc}
            </div>
          </div>
        )}

        <div className="text-center text-xs text-slate-400 mb-6">
          {t.confirm_footer}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100  hover:bg-slate-200 transition-colors text-sm cursor-pointer"
          >
            {t.btn_recheck}
          </button>
          <button
            onClick={onConfirm}
            className="py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 text-sm cursor-pointer"
          >
            {t.btn_complete}
          </button>
        </div>
      </div>
    </div>
  );
};

// Admin Team Detail Modal
export const TeamDetailModal = ({
  isOpen,
  onClose,
  team,
  judges,
  scores,
  eventSettings,
}) => {
  const { t, lang } = useContext(AppContext);
  if (!isOpen || !team) return null;

  const teamScores = judges.map((j) => {
    const s = scores[`${team.id}_${j.id}`];
    return { judge: j, score: s };
  });

  // Sort: Submitted first, then by name
  teamScores.sort((a, b) => {
    if (a.score && !b.score) return -1;
    if (!a.score && b.score) return 1;
    return a.judge.name.localeCompare(b.judge.name);
  });

  const submittedScores = teamScores
    .filter((t) => t.score)
    .map((t) => t.score.total);
  const maxScore = Math.max(...submittedScores);
  const minScore = Math.min(...submittedScores);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white  w-[90%] max-w-[600px] rounded-[32px] p-8 shadow-2xl border border-white/10 animate-in zoom-in-95 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t.detail_title}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 ">{team.name}</h2>
            <p className="text-sm text-slate-500">
              {lang === "en" ? team.univ_en : team.univ} | {team.presenter}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100  rounded-full cursor-pointer"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {teamScores.map(({ judge, score }) => {
            const isMax =
              score && score.total === maxScore && submittedScores.length > 2;
            const isMin =
              score && score.total === minScore && submittedScores.length > 2;
            const jName =
              (lang === "en" ? judge.name_en : judge.name) ||
              judge.name ||
              "Unknown";

            return (
              <div
                key={judge.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${score ? "bg-slate-50  border-slate-100 " : "bg-red-50  border-red-100 "}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${score ? "bg-slate-200  text-slate-600 " : "bg-red-100 text-red-600"}`}
                  >
                    {jName[0]}
                  </div>
                  <div>
                    <div
                      className={`font-bold text-sm ${!score && "text-red-600 "}`}
                    >
                      {jName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {judge.company}
                    </div>
                  </div>
                </div>

                {score ? (
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isMax && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-500 font-bold">
                          MAX
                        </span>
                      )}
                      {isMin && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-500 font-bold">
                          MIN
                        </span>
                      )}
                      <div
                        className={`text-2xl font-black ${(isMax || isMin) && eventSettings?.scoringMethod === "trimmed" ? "text-slate-400 line-through decoration-slate-400/50" : "text-slate-800 "}`}
                      >
                        {score.total}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {t.submitted}
                    </div>
                    {score.signature && (
                      <div className="mt-2 flex justify-end">
                        <img
                          src={score.signature}
                          alt="Signature"
                          className="h-8 opacity-70"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-500 font-bold text-sm animate-pulse">
                    <AlertCircle className="w-4 h-4" /> {t.not_submitted}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100  flex justify-between text-xs text-slate-400">
          <span>
            {t.detail_total_judges}: {judges.length}
          </span>
          <span
            className={
              teamScores.filter((t) => t.score).length < judges.length
                ? "text-red-500 font-bold"
                : "text-green-500 font-bold"
            }
          >
            {t.detail_completed}: {teamScores.filter((t) => t.score).length}/
            {judges.length}
          </span>
        </div>
      </div>
    </div>
  );
};

// Secure Admin Login Modal
export const AdminLoginModal = ({ isOpen, onClose, onLogin }) => {
  const { t } = useContext(AppContext);
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const adminUser = import.meta.env.VITE_ADMIN_USERNAME || "congkong";
    const adminPw = import.meta.env.VITE_ADMIN_PASSWORD || "friends";

    if (id === adminUser && pw === adminPw) {
      onLogin();
      onClose();
    } else {
      setError(t.err_auth);
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white  w-[360px] rounded-[32px] p-8 shadow-2xl border border-white/10 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />{" "}
            {t.admin_modal_title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100  rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-3.5 text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={t.admin_placeholder_id}
              autoFocus
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full bg-slate-100  rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="relative">
            <div className="absolute left-4 top-3.5 text-slate-400">
              <Key className="w-4 h-4" />
            </div>
            <input
              type={showPw ? "text" : "password"}
              placeholder={t.admin_placeholder_pw}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full bg-slate-100  rounded-2xl py-3 pl-12 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPw ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center font-bold animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 cursor-pointer"
          >
            {t.btn_access}
          </button>
        </form>
      </div>
    </div>
  );
};

export const SignatureModal = ({ isOpen, onClose, onSave }) => {
  const { t } = useContext(AppContext);
  const canvasRef = useRef(null);
  const [hasSign, setHasSign] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.lineCap = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#3b82f6";
    }
  }, [isOpen]);

  const draw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    // Check safe access for touch events
    const clientX =
      e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const clientY =
      e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    const y = clientY - rect.top;

    if (e.type === "mousedown" || e.type === "touchstart") {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setHasSign(true);
    } else if (e.type === "mousemove" || e.type === "touchmove") {
      e.preventDefault();
      if (e.buttons > 0 || e.type === "touchmove") {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in">
      <div className="bg-white  w-[90%] max-w-[600px] rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-lg font-bold mb-4 text-center">{t.sign_title}</h3>
        <p className="text-xs text-center text-slate-500 mb-4">{t.sign_desc}</p>
        <div className="bg-slate-50  rounded-2xl border border-slate-200  h-64 w-full relative overflow-hidden mb-4">
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none cursor-crosshair"
            onMouseDown={draw}
            onMouseMove={draw}
            onTouchStart={draw}
            onTouchMove={draw}
          />
          {!hasSign && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs pointer-events-none">
              {t.sign_placeholder}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 text-sm cursor-pointer"
          >
            {t.btn_cancel}
          </button>
          <button
            onClick={() => onSave(canvasRef.current.toDataURL())}
            disabled={!hasSign}
            className="py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 text-sm disabled:opacity-50 cursor-pointer"
          >
            {t.btn_complete}
          </button>
        </div>
      </div>
    </div>
  );
};

// Secure Reset Confirmation Modal
export const ResetConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}) => {
  const { t } = useContext(AppContext);
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const adminPw = import.meta.env.VITE_ADMIN_PASSWORD || "friends";

    if (pw === adminPw) {
      onConfirm();
      onClose();
    } else {
      setError(t.err_wrong_pw);
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-[90%] max-w-[400px] rounded-[32px] p-8 shadow-2xl border border-red-100 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-6 h-6" /> {title || t.reset_modal_title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {description || t.reset_modal_desc}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-3.5 text-slate-400">
              <Key className="w-4 h-4" />
            </div>
            <input
              type={showPw ? "text" : "password"}
              placeholder={t.admin_placeholder_pw}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full bg-slate-100 rounded-2xl py-3 pl-12 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPw ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center font-bold animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/30 transition-all transform active:scale-95 cursor-pointer"
          >
            {t.btn_confirm_reset}
          </button>
        </form>
      </div>
    </div>
  );
};

// Specific Team Selection Modal
export const TeamSelectionModal = ({
  isOpen,
  onClose,
  teams,
  assignedTeamIds,
  onSave,
}) => {
  const { t, lang } = useContext(AppContext);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(assignedTeamIds || []);

  useEffect(() => {
    if (isOpen) setSelected(assignedTeamIds || []);
  }, [isOpen, assignedTeamIds]);

  if (!isOpen) return null;

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(search.toLowerCase()) ||
      team.presenter?.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleTeam = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white  w-[90%] max-w-[500px] h-[80vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 bg-white z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />{" "}
              {t.manage_teams_modal_title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100  rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={t.search_placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-100 rounded-xl py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
          <div className="space-y-2">
            {filteredTeams.map((team) => {
              const isSelected = selected.includes(team.id);
              return (
                <div
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-100"}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                        {team.seq}
                      </span>
                      <span className="font-bold text-sm text-slate-800">
                        {team.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 pl-1">
                      {lang === "en" ? team.univ_en : team.univ} |{" "}
                      {team.presenter}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-slate-300"}`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex justify-between items-center mb-4 text-xs font-bold text-slate-500 px-2">
            <span>{selected.length} teams selected</span>
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => setSelected([])}
            >
              Clear All
            </span>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            {t.btn_save}
          </button>
        </div>
      </div>
    </div>
  );
};
