import React, { useState, useRef, useContext, useEffect } from "react";
import {
  Save,
  Upload,
  Image as ImageIcon,
  Clock,
  MapPin,
  Type,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { GlassCard } from "./ui";
import { AppContext } from "../context";
import { ResetConfirmModal } from "./modals";

export const EventSettings = ({ settings, onSave, onReset, onResetScores }) => {
  const { t } = useContext(AppContext);
  const [localSettings, setLocalSettings] = useState({
    bannerUrl: "",
    timerPresentation: 12,
    timerQnA: 3,
    mainTitle: "",
    eventTime: "",
    location: "",
    description: "",
  });
  const fileInputRef = useRef(null);

  const [resetTarget, setResetTarget] = useState(null);

  useEffect(() => {
    const defaults = {
      bannerUrl: "",
      timerPresentation: 12,
      timerQnA: 3,
      mainTitle: "",
      eventTime: "",
      location: "",
      description: "",
    };
    setLocalSettings({ ...defaults, ...(settings || {}) });
  }, [settings]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings((prev) => ({ ...prev, bannerUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field, value) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    alert(t.msg_event_saved);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-20">
      <ResetConfirmModal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={() => {
          if (resetTarget === "ALL") onReset();
          if (resetTarget === "SCORES") onResetScores();
        }}
        title={resetTarget === "SCORES" ? t.btn_reset_scores : undefined}
        description={
          resetTarget === "SCORES" ? t.msg_reset_scores_warning : undefined
        }
      />
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-indigo-600" /> {t.event_settings}
        </h2>

        {/* Banner Upload Section */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            {t.banner_upload}
          </h3>
          <GlassCard className="p-6 border-slate-200">
            <div className="flex flex-col items-center justify-center gap-4">
              {localSettings.bannerUrl ? (
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                  <img
                    src={localSettings.bannerUrl}
                    alt="Event Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white/90 text-slate-800 rounded-lg font-bold hover:bg-white transition-colors cursor-pointer"
                    >
                      {t.btn_change_image}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer"
                >
                  <Upload className="w-8 h-8" />
                  <span className="font-medium">{t.banner_upload}</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </GlassCard>
        </section>

        {/* Timer Settings Section */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            {t.timer_settings}
          </h3>
          <GlassCard className="p-6 border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {t.presentation_time}
                </label>
                <input
                  type="number"
                  value={localSettings.timerPresentation}
                  onChange={(e) =>
                    handleChange(
                      "timerPresentation",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-lg"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {t.qna_time}
                </label>
                <input
                  type="number"
                  value={localSettings.timerQnA}
                  onChange={(e) =>
                    handleChange("timerQnA", parseInt(e.target.value) || 0)
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-lg"
                />
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Detailed Info Section */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            {t.detail_info}
          </h3>
          <GlassCard className="p-6 border-slate-200 space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                <Type className="w-4 h-4" /> {t.main_title}
              </label>
              <input
                value={localSettings.mainTitle}
                onChange={(e) => handleChange("mainTitle", e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. '25년 기술사업화"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {t.event_time}
                </label>
                <input
                  value={localSettings.eventTime}
                  onChange={(e) => handleChange("eventTime", e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 2025. 12. 03 (수)"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {t.location}
                </label>
                <input
                  value={localSettings.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. CCEX Conf. 307호"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                <Type className="w-4 h-4" /> {t.description}
              </label>
              <textarea
                value={localSettings.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                placeholder={t.placeholder_desc}
              />
            </div>
          </GlassCard>
        </section>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-5 h-5" /> {t.save_changes}
          </button>
        </div>

        {/* Danger Zone */}
        <section className="pt-8 border-t border-slate-200">
          <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {t.danger_zone}
          </h3>
          <GlassCard className="p-6 border-red-200 bg-red-50/50">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">
                    {t.btn_reset_scores}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {t.msg_reset_scores_warning}
                  </p>
                </div>
                <button
                  onClick={() => setResetTarget("SCORES")}
                  className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 transition-all cursor-pointer shadow-sm"
                >
                  {t.btn_reset_scores}
                </button>
              </div>

              <div className="w-full h-px bg-red-200/50" />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">
                    {t.btn_reset_all}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {t.msg_reset_warning_detail}
                  </p>
                </div>
                <button
                  onClick={() => setResetTarget("ALL")}
                  className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all cursor-pointer shadow-sm"
                >
                  {t.btn_reset_all}
                </button>
              </div>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
};
