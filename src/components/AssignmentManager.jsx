import React, { useState, useContext, useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ClipboardList,
  Save,
  Users,
  CheckCircle,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { TeamSelectionModal } from "./modals";
import { AppContext } from "../context";
import { GlassCard } from "./ui";

// Utility for merging tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Robust MultiSelect using Radix Popover (Portaled)
const MultiSelectDropdown = ({ options, selected, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);

  const toggleOption = (value) => {
    const current = selected || [];
    let updated;
    if (current.includes(value)) {
      updated = current.filter((item) => item !== value);
    } else {
      updated = [...current, value];
    }
    onChange(updated);
  };

  const removeTag = (e, value) => {
    e.stopPropagation();
    onChange((selected || []).filter((item) => item !== value));
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div
          className={cn(
            "w-full p-2 min-h-[38px] rounded-lg border text-xs font-bold flex items-center justify-between cursor-pointer transition-all bg-white hover:border-blue-300",
            open ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200",
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {(!selected || selected.length === 0) && (
              <span className="text-slate-400 font-normal">
                {placeholder || "Select"}
              </span>
            )}
            {selected?.map((val) => (
              <span
                key={val}
                className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1 leading-none border border-blue-100"
                onClick={(e) => e.stopPropagation()}
              >
                {val}
                <div
                  onClick={(e) => removeTag(e, val)}
                  className="hover:text-red-500 cursor-pointer p-0.5 rounded-full hover:bg-white transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </div>
              </span>
            ))}
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 min-w-[200px] w-[var(--radix-popover-trigger-width)] bg-white border border-slate-200 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200"
          sideOffset={5}
          align="start"
        >
          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
            {options
              .filter((opt) => opt.value)
              .map((opt) => {
                const isSelected = selected?.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={cn(
                      "px-3 py-2 text-xs font-bold cursor-pointer flex items-center justify-between rounded-md transition-colors",
                      isSelected
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                  </div>
                );
              })}
            {options.length <= 1 && (
              <div className="p-3 text-center text-xs text-slate-400">
                No categories found
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export const AssignmentManager = ({ judges, teams, setJudges, scores }) => {
  const { t, lang } = useContext(AppContext);

  const [localJudges, setLocalJudges] = useState(judges);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingJudgeId, setEditingJudgeId] = useState(null);

  // Dynamically extract unique categories from teams
  const CATEGORIES = useMemo(() => {
    const uniqueCategories = [
      ...new Set(teams.map((t) => t.category).filter(Boolean)),
    ];
    return [...uniqueCategories.map((cat) => ({ value: cat, label: cat }))];
  }, [teams]);

  // Calculate stats per category
  const categoryStats = useMemo(() => {
    const stats = {};
    CATEGORIES.forEach((cat) => {
      stats[cat.value] = {
        totalTeams: teams.filter((t) => t.category === cat.value).length,
        label: cat.label,
      };
    });
    return stats;
  }, [teams, CATEGORIES]);

  // Calculate progress per judge
  const judgeProgress = useMemo(() => {
    const progress = {};
    localJudges.forEach((judge) => {
      // Logic for Multi-Category: Teams matching ANY of the assigned categories
      const myCats = Array.isArray(judge.assignedCategories)
        ? judge.assignedCategories
        : judge.assignedCategory
          ? [judge.assignedCategory]
          : [];

      // If no categories assigned, assume NO teams (or ALL teams logic if desired)
      // Current logic: if no assignment, show ALL (backward compat)
      // 1. Determine Assigned Teams (Union Logic)
      const specificTeamIds = judge.assignedTeamIds || [];
      const hasSpecific = specificTeamIds.length > 0;
      const hasCategories = myCats.length > 0;

      let assignedTeams = teams;

      if (hasSpecific || hasCategories) {
        assignedTeams = teams.filter((t) => {
          const isCategoryMatch = hasCategories && myCats.includes(t.category);
          const isSpecificMatch = hasSpecific && specificTeamIds.includes(t.id);
          return isCategoryMatch || isSpecificMatch;
        });
      }

      const completedCount = assignedTeams.filter(
        (team) => scores[`${team.id}_${judge.id}`],
      ).length;

      progress[judge.id] = {
        completed: completedCount,
        total: assignedTeams.length,
        percentage:
          assignedTeams.length > 0
            ? Math.round((completedCount / assignedTeams.length) * 100)
            : 0,
      };
    });
    return progress;
  }, [localJudges, teams, scores]);

  const handleCategoryChange = (judgeId, newCategories) => {
    setLocalJudges((prev) =>
      prev.map((j) =>
        j.id === judgeId
          ? { ...j, assignedCategories: newCategories, assignedCategory: null }
          : j,
      ),
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    setJudges(localJudges);
    setHasChanges(false);
  };

  const handleTeamSave = (teamIds) => {
    setLocalJudges((prev) =>
      prev.map((j) =>
        j.id === editingJudgeId ? { ...j, assignedTeamIds: teamIds } : j,
      ),
    );
    setHasChanges(true);
  };

  // Quick assign: Add category to all (or clear all)
  const handleQuickAssign = (category) => {
    // Logic: Append this category to all judges who don't have it yet
    setLocalJudges((prev) =>
      prev.map((j) => {
        const currentCats = Array.isArray(j.assignedCategories)
          ? j.assignedCategories
          : j.assignedCategory
            ? [j.assignedCategory]
            : [];

        if (!currentCats.includes(category)) {
          return {
            ...j,
            assignedCategories: [...currentCats, category],
            assignedCategory: null,
          };
        }
        return j;
      }),
    );
    setHasChanges(true);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Section: Header & Quick Stats */}
      <GlassCard className="shrink-0 p-4 flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-4 min-w-[200px]">
          <div className="bg-blue-50 p-3 rounded-2xl">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {t.assign_manager}
            </h2>
            <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
              {t.assign_desc}
            </p>
          </div>
        </div>

        {/* Compact stats row - Horizontal Scroll */}
        <div className="flex-1 flex gap-2 overflow-x-auto px-2 font-sm items-center hide-scrollbar mask-linear-fade">
          {CATEGORIES.map((cat) => {
            const stats = categoryStats[cat.value];
            // Count judges who have this category in their list
            const assignedJudges = localJudges.filter((j) => {
              const cats = Array.isArray(j.assignedCategories)
                ? j.assignedCategories
                : j.assignedCategory
                  ? [j.assignedCategory]
                  : [];
              return cats.includes(cat.value);
            });

            return (
              <div
                key={cat.value}
                className="flex flex-col gap-1 min-w-[140px] bg-slate-50 border border-slate-100 rounded-xl p-3 hover:bg-slate-100 transition-colors group relative cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate max-w-[80px]"
                    title={cat.label}
                  >
                    {cat.label}
                  </span>
                  <span className="bg-white text-slate-600 shadow-sm text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-slate-100">
                    {assignedJudges.length}
                  </span>
                </div>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-lg font-black text-slate-800 leading-none">
                    {stats.totalTeams}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold mb-0.5">
                    {t.nav_teams || "Teams"}
                  </span>
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-blue-50/90 backdrop-blur-[1px] rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAssign(cat.value);
                    }}
                    className="text-[10px] font-bold text-blue-600 bg-white px-3 py-1.5 rounded-lg shadow-sm hover:scale-105 transition-transform"
                  >
                    + {t.add_to_all}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex gap-2 items-center pl-4 border-l border-slate-100 min-w-[150px] justify-end">
          {hasChanges && (
            <div className="hidden xl:flex flex-col items-end mr-2 animate-in slide-in-from-right-2">
              <span className="text-xs font-bold text-amber-600 whitespace-nowrap">
                {t.unsaved_changes}
              </span>
              <span className="text-[10px] text-slate-400">
                {t.save_to_apply}
              </span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer whitespace-nowrap ${
              hasChanges
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30 hover:scale-105 active:scale-95"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            }`}
          >
            <Save className="w-4 h-4" /> {t.save_assignments || "Save"}
          </button>
        </div>
      </GlassCard>

      {/* Main List Area */}
      <GlassCard className="flex-1 overflow-hidden flex flex-col p-0 shadow-xl border-slate-200/60">
        <div className="p-4 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md grid grid-cols-12 gap-4 font-bold text-xs text-slate-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4 lg:col-span-3">{t.judge_profile}</div>
          <div className="col-span-2 hidden lg:block">
            {t.label_affiliation || "Affiliation"}
          </div>
          <div className="col-span-4 lg:col-span-3">
            {t.assigned_categories}
          </div>
          <div className="col-span-3">{t.progress_status}</div>
        </div>

        <div className="overflow-y-auto flex-1 p-0 bg-white custom-scrollbar">
          {localJudges.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <p>{t.no_judges_found}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {localJudges.map((judge, idx) => {
                const progress = judgeProgress[judge.id];
                const isComplete =
                  progress.percentage === 100 && progress.total > 0;
                const hasStarted = progress.percentage > 0;

                // Normalize categories for the dropdown
                const currentCategories = Array.isArray(
                  judge.assignedCategories,
                )
                  ? judge.assignedCategories
                  : judge.assignedCategory
                    ? [judge.assignedCategory]
                    : [];

                return (
                  <div
                    key={judge.id}
                    className="grid grid-cols-12 gap-4 items-start p-4 hover:bg-blue-50/30 transition-colors group relative z-0"
                  >
                    <div className="col-span-1 text-center font-mono text-sm font-bold text-slate-300 group-hover:text-blue-400 transition-colors pt-2">
                      {idx + 1}
                    </div>

                    <div className="col-span-4 lg:col-span-3 pt-1">
                      <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                        {judge.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {judge.title}
                      </div>
                    </div>

                    <div className="col-span-2 hidden lg:block text-xs font-medium text-slate-500 pt-2">
                      {judge.company}
                    </div>

                    <div className="col-span-4 lg:col-span-3 relative z-10 space-y-2">
                      <MultiSelectDropdown
                        options={CATEGORIES}
                        selected={currentCategories}
                        onChange={(newCats) =>
                          handleCategoryChange(judge.id, newCats)
                        }
                        placeholder={t.label_category || "Category"}
                      />

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setEditingJudgeId(judge.id)}
                          className="text-[10px] font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <Users className="w-3 h-3" /> {t.btn_manage_teams}
                        </button>
                        {judge.assignedTeamIds?.length > 0 && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {t.specific_teams_count.replace(
                              "{n}",
                              judge.assignedTeamIds.length,
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-3 pt-1">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                          <span>{t.judge_progress || "Progress"}</span>
                          <span
                            className={
                              isComplete
                                ? "text-green-600"
                                : hasStarted
                                  ? "text-blue-600"
                                  : ""
                            }
                          >
                            {progress.percentage}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ease-out ${
                                isComplete ? "bg-green-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          {isComplete ? (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400 font-medium shrink-0 w-8 text-right">
                              {progress.completed}/{progress.total}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Team Selection Modal */}
      {editingJudgeId && (
        <TeamSelectionModal
          isOpen={true}
          onClose={() => setEditingJudgeId(null)}
          teams={teams}
          assignedTeamIds={
            localJudges.find((j) => j.id === editingJudgeId)?.assignedTeamIds
          }
          onSave={handleTeamSave}
        />
      )}
    </div>
  );
};
