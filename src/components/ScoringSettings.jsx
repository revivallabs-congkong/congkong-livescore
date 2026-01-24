import React, { useState, useContext } from "react";
import {
  Save,
  Check,
  Info,
  LayoutTemplate,
  Calculator,
  Trophy,
  Users,
  Star,
  Crown,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { GlassCard, AppleSlider } from "./ui";
import { AppContext } from "../context";

const MethodCard = ({ id, label, desc, active, onClick, icon: Icon, tag }) => (
  <div
    onClick={() => onClick(id)}
    className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 overflow-hidden group
        ${
          active
            ? "bg-linear-to-br from-blue-600 to-blue-700 border-blue-600 shadow-xl shadow-blue-200/50 text-white ring-2 ring-blue-600 ring-offset-2"
            : "bg-white border-slate-100 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1"
        }`}
  >
    <div className="flex justify-between items-start mb-3 relative z-10">
      <div
        className={`p-3 rounded-xl transition-colors ${active ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      {active && (
        <div className="p-1 bg-white rounded-full text-blue-600">
          <Check className="w-4 h-4" />
        </div>
      )}
    </div>

    <h3
      className={`font-bold text-lg mb-1 relative z-10 ${active ? "text-white" : "text-slate-800"}`}
    >
      {label}
    </h3>
    <p
      className={`text-xs leading-relaxed relative z-10 ${active ? "text-blue-100" : "text-slate-500"}`}
    >
      {desc}
    </p>

    {tag && (
      <span
        className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm z-10
           ${active ? "bg-white text-blue-600" : "bg-slate-100 text-slate-500"}`}
      >
        {tag}
      </span>
    )}

    {/* Background Decor */}
    {active && (
      <>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-tr-full -ml-8 -mb-8 pointer-events-none" />
      </>
    )}
  </div>
);

export const ScoringSettings = ({ settings, onSave }) => {
  const { t } = useContext(AppContext);
  const [method, setMethod] = useState(settings?.scoringMethod || "avg");
  const [voteMode, setVoteMode] = useState(settings?.voteMode || "none");
  const [ratio, setRatio] = useState(
    settings?.voteRatio || { judge: 70, audience: 30 },
  );
  const [rankBonus, setRankBonus] = useState(
    settings?.rankBonus || { 1: 5, 2: 3, 3: 1, other: 0 },
  );

  useEffect(() => {
    setMethod(settings?.scoringMethod || "avg");
    setVoteMode(settings?.voteMode || "none");
    setRatio(settings?.voteRatio || { judge: 70, audience: 30 });
    setRankBonus(settings?.rankBonus || { 1: 5, 2: 3, 3: 1, other: 0 });
  }, [settings]);

  const handleSave = () => {
    onSave({
      ...settings,
      scoringMethod: method,
      voteMode: voteMode,
      voteRatio: ratio,
      rankBonus: rankBonus,
    });
    alert(t.scoring_save_success);
  };

  return (
    <div className="h-full flex flex-col cursor-auto">
      {/* Top Header */}
      <div className="flex justify-between items-center shrink-0 mb-6 p-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {t.scoring_title}
            </h2>
            <p className="text-sm text-slate-500">{t.scoring_desc}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 font-bold text-sm flex items-center gap-2 transition-transform active:scale-95"
        >
          <Save className="w-4 h-4" /> {t.save_config}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-1 pb-10 space-y-6">
        {/* Section 1: Scoring Method */}
        <section>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>{" "}
            {t.scoring_method}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MethodCard
              id="avg"
              label={t.method_avg}
              desc={t.method_avg_desc}
              active={method === "avg"}
              onClick={setMethod}
              icon={LayoutTemplate}
              tag={t.default}
            />
            <MethodCard
              id="trimmed"
              label={t.method_trimmed}
              desc={t.method_trimmed_desc}
              active={method === "trimmed"}
              onClick={setMethod}
              icon={Star}
              tag={t.recommended}
            />
            <MethodCard
              id="sum"
              label={t.method_sum}
              desc={t.method_sum_desc}
              active={method === "sum"}
              onClick={setMethod}
              icon={Calculator}
            />
          </div>
        </section>

        <div className="w-full h-px bg-slate-200/60" />

        {/* Section 2: Voting Integration */}
        <section>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>{" "}
            {t.voting_integration}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* None */}
            <button
              onClick={() => setVoteMode("none")}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden group
                       ${
                         voteMode === "none"
                           ? "bg-linear-to-br from-slate-600 to-slate-700 border-slate-600 shadow-lg shadow-slate-200/50 text-white ring-2 ring-slate-600 ring-offset-2"
                           : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md hover:-translate-y-1"
                       }`}
            >
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div
                  className={`p-2 rounded-lg ${voteMode === "none" ? "bg-white/20 text-white" : "bg-slate-50 text-slate-500"}`}
                >
                  <LogOut className="w-5 h-5" />
                </div>
                {voteMode === "none" && (
                  <CheckCircle2 className="w-5 h-5 text-slate-100" />
                )}
              </div>
              <div className="font-bold text-lg mb-1 relative z-10">
                {t.vote_none}
              </div>
              <div
                className={`text-xs relative z-10 ${voteMode === "none" ? "text-slate-100" : "text-slate-400"}`}
              >
                Judge scores only
              </div>
              {voteMode === "none" && (
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
              )}
            </button>

            {/* Ratio */}
            <button
              onClick={() => setVoteMode("ratio")}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden group
                       ${
                         voteMode === "ratio"
                           ? "bg-linear-to-br from-blue-600 to-blue-700 border-blue-600 shadow-lg shadow-blue-200/50 text-white ring-2 ring-blue-600 ring-offset-2"
                           : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-md hover:-translate-y-1"
                       }`}
            >
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div
                  className={`p-2 rounded-lg ${voteMode === "ratio" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"}`}
                >
                  <Users className="w-5 h-5" />
                </div>
                {voteMode === "ratio" && (
                  <CheckCircle2 className="w-5 h-5 text-blue-200" />
                )}
              </div>
              <div className="font-bold text-lg mb-1 relative z-10">
                {t.vote_ratio}
              </div>
              <div
                className={`text-xs relative z-10 ${voteMode === "ratio" ? "text-blue-100" : "text-slate-400"}`}
              >
                Weighted score combination
              </div>
              {voteMode === "ratio" && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full -mr-6 -mt-6 pointer-events-none" />
              )}
            </button>

            {/* Rank */}
            <button
              onClick={() => setVoteMode("rank")}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden group
                       ${
                         voteMode === "rank"
                           ? "bg-linear-to-br from-indigo-500 to-indigo-600 border-indigo-500 shadow-lg shadow-indigo-200/50 text-white ring-2 ring-indigo-500 ring-offset-2"
                           : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md hover:-translate-y-1"
                       }`}
            >
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div
                  className={`p-2 rounded-lg ${voteMode === "rank" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"}`}
                >
                  <Crown className="w-5 h-5" />
                </div>
                {voteMode === "rank" && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-100" />
                )}
              </div>
              <div className="font-bold text-lg mb-1 relative z-10">
                {t.vote_rank}
              </div>
              <div
                className={`text-xs relative z-10 ${voteMode === "rank" ? "text-indigo-100" : "text-slate-400"}`}
              >
                Bonus points by rank
              </div>
              {voteMode === "rank" && (
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-tr-full -ml-8 -mb-8 pointer-events-none" />
              )}
            </button>
          </div>

          {/* Conditional Logic Editors */}
          {voteMode === "ratio" && (
            <GlassCard className="border-blue-200 bg-blue-50/50 p-6 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold text-blue-800 mb-6 flex items-center gap-2">
                <Info className="w-4 h-4" /> {t.ratio_config}
              </h3>

              <div className="flex items-center gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                    <span>
                      {t.judge_weight} ({ratio.judge}%)
                    </span>
                    <span>
                      {t.audience_weight} ({ratio.audience}%)
                    </span>
                  </div>
                  <AppleSlider
                    value={ratio.judge}
                    onChange={(val) =>
                      setRatio({ judge: val, audience: 100 - val })
                    }
                    max={100}
                    step={5}
                    className="h-4"
                  />
                </div>
                <div className="text-2xl font-black text-blue-600 w-24 text-center">
                  {ratio.judge}:{ratio.audience}
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/60 rounded-xl text-xs text-blue-700 font-mono text-center border border-blue-100">
                {t.ratio_formula
                  .replace("{j}", ratio.judge)
                  .replace("{a}", ratio.audience)}
              </div>
            </GlassCard>
          )}

          {voteMode === "rank" && (
            <GlassCard className="border-indigo-200 bg-indigo-50/50 p-6 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold text-indigo-800 mb-6 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> {t.rank_config}
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    key: 1,
                    label: t.bonus_1st,
                    icon: Crown,
                    color: "text-yellow-500",
                  },
                  {
                    key: 2,
                    label: t.bonus_2nd,
                    icon: Trophy,
                    color: "text-slate-400",
                  },
                  {
                    key: 3,
                    label: t.bonus_3rd,
                    icon: Trophy,
                    color: "text-amber-700",
                  },
                  {
                    key: "other",
                    label: t.bonus_other,
                    icon: Users,
                    color: "text-slate-500",
                  },
                ].map((rank) => (
                  <div
                    key={rank.key}
                    className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm"
                  >
                    <div
                      className={`flex items-center gap-2 mb-2 font-bold text-sm ${rank.color}`}
                    >
                      <rank.icon className="w-4 h-4" /> {rank.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={rankBonus[rank.key]}
                        onChange={(e) =>
                          setRankBonus({
                            ...rankBonus,
                            [rank.key]: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full text-center font-black text-xl py-2 bg-slate-50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400">
                        pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-white/60 rounded-xl text-xs text-indigo-800 font-mono text-center border border-indigo-100">
                {t.rank_formula}
              </div>
            </GlassCard>
          )}
        </section>
      </div>
    </div>
  );
};
