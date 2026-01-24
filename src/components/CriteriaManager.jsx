import React, { useState, useContext, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  GripVertical,
  Layers,
  Hash,
  Type,
  HelpCircle,
} from "lucide-react";
import { GlassCard } from "./ui";
import { AppContext } from "../context";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableItem = ({ item, categoryId, onUpdate, onDelete, t }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative grid grid-cols-12 gap-3 items-center p-3 bg-white rounded-xl border transition-all duration-200 ${isDragging ? "shadow-lg ring-2 ring-blue-500/20 border-blue-200 rotate-1" : "border-slate-100 hover:border-blue-100 hover:shadow-sm"}`}
    >
      <div className="col-span-1 flex justify-center">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>
      <div className="col-span-3">
        <input
          value={item.label}
          onChange={(e) => onUpdate(item.id, "label", e.target.value)}
          className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-300"
          placeholder={t.item_name_ko}
        />
      </div>
      <div className="col-span-3">
        <input
          value={item.label_en || ""}
          onChange={(e) => onUpdate(item.id, "label_en", e.target.value)}
          className="w-full text-sm font-medium text-slate-500 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-300"
          placeholder={t.item_name_en}
        />
      </div>
      <div className="col-span-2">
        <div className="relative">
          <input
            type="number"
            value={item.max}
            onChange={(e) =>
              onUpdate(item.id, "max", parseInt(e.target.value) || 0)
            }
            className="w-full text-center text-sm font-bold text-blue-600 bg-blue-50/50 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>
      <div className="col-span-2">
        <input
          value={item.desc || ""}
          onChange={(e) => onUpdate(item.id, "desc", e.target.value)}
          className="w-full text-xs text-slate-400 bg-transparent border-b border-transparent focus:border-slate-400 focus:outline-none transition-colors placeholder:text-slate-200"
          placeholder={t.item_desc}
        />
      </div>
      <div className="col-span-1 flex justify-end">
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const CriteriaManager = ({ settings, onSave }) => {
  const { t } = useContext(AppContext);

  // Initialize State from Nested Structure
  const initializeState = () => {
    const defaultCats = [
      {
        id: "cat_creativity",
        label: "창의성",
        label_en: "Creativity",
        max: 30,
      },
      { id: "cat_market", label: "시장성", label_en: "Marketability", max: 40 },
      { id: "cat_business", label: "사업성", label_en: "Feasibility", max: 30 },
    ];

    if (settings?.criteria?.categories) {
      const cats = settings.criteria.categories.map((c) => ({
        ...c,
        max: c.maxPoints || c.max || 0, // Handle inconsistencies in naming if any
      }));

      const flatItems = settings.criteria.categories.flatMap((cat) =>
        (cat.items || []).map((item) => ({ ...item, category: cat.id })),
      );

      return { cats, items: flatItems };
    }

    return { cats: defaultCats, items: [] };
  };

  const { cats: initCats, items: initItems } = initializeState();
  const [categories, setCategories] = useState(initCats);
  const [items, setItems] = useState(initItems);
  const [activeTab, setActiveTab] = useState(
    categories?.[0]?.id || "cat_creativity",
  );

  useEffect(() => {
    const { cats, items } = initializeState();
    setCategories(cats);
    setItems(items);
    if (!cats.find((c) => c.id === activeTab)) {
      setActiveTab(cats?.[0]?.id || null);
    }
  }, [settings]);

  const activeCategory = categories.find((c) => c.id === activeTab);
  const categoryItems = items.filter((i) => i.category === activeTab);
  const currentSum = categoryItems.reduce((sum, item) => sum + item.max, 0);
  const totalMaxScore = categories.reduce((sum, cat) => sum + cat.max, 0);

  const handleUpdateCategory = (id, field, value) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleUpdateItem = (itemId, field, value) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)),
    );
  };

  const handleAddItem = () => {
    const newItem = {
      id: `c_${Date.now()}`,
      category: activeTab,
      label: "",
      label_en: "",
      max: 5,
      desc: "",
    };
    setItems([...items, newItem]);
  };

  const handleDeleteItem = (itemId) => {
    setItems(items.filter((i) => i.id !== itemId));
  };

  const handleSave = () => {
    // Validation check
    let hasError = false;
    categories.forEach((cat) => {
      const sum = items
        .filter((i) => i.category === cat.id)
        .reduce((a, b) => a + b.max, 0);
      if (sum !== cat.max) {
        alert(t.item_sum_error.replace("{sum}", sum).replace("{max}", cat.max));
        hasError = true;
      }
    });

    if (!hasError) {
      // Re-nest structure for saving
      const nestedCategories = categories.map((cat) => ({
        ...cat,
        maxPoints: cat.max, // Persist compatible key
        items: items.filter((i) => i.category === cat.id),
      }));

      onSave({
        ...settings,
        criteria: {
          ...settings.criteria,
          categories: nestedCategories,
        },
      });
      alert(t.criteria_save_success);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-1">
      {/* Top Header */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {t.criteria_title}
            </h2>
            <p className="text-sm text-slate-500">{t.criteria_desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-500">
              {t.total_points}
            </div>
            <div
              className={`text-xl font-black ${totalMaxScore === 100 ? "text-blue-600" : "text-red-500"}`}
            >
              {totalMaxScore} pts
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 font-bold text-sm flex items-center gap-2 transition-transform active:scale-95"
          >
            <Save className="w-4 h-4" /> {t.save_config}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left: Category Sidebar */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-hidden">
          {/* ... existing content ... */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {categories.map((cat) => {
              const catSum = items
                .filter((i) => i.category === cat.id)
                .reduce((a, b) => a + b.max, 0);
              const isError = catSum !== cat.max;
              const isActive = activeTab === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${isActive ? "bg-white border-blue-500 shadow-md ring-4 ring-blue-50" : "bg-white border-transparent hover:border-slate-200"}`}
                >
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex-1">
                      <input
                        value={cat.label}
                        onChange={(e) =>
                          handleUpdateCategory(cat.id, "label", e.target.value)
                        }
                        className={`w-full font-bold bg-transparent focus:outline-none focus:border-b border-slate-300 ${isActive ? "text-blue-900" : "text-slate-700"}`}
                        placeholder={t.category_name_ko}
                      />
                      <input
                        value={cat.label_en || ""}
                        onChange={(e) =>
                          handleUpdateCategory(
                            cat.id,
                            "label_en",
                            e.target.value,
                          )
                        }
                        className="w-full text-xs mt-1 bg-transparent focus:outline-none text-slate-400 focus:text-slate-600"
                        placeholder={t.category_name_en}
                      />
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={cat.max}
                          onChange={(e) =>
                            handleUpdateCategory(
                              cat.id,
                              "max",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className={`w-12 text-right font-black text-lg bg-transparent focus:outline-none border-b border-transparent focus:border-blue-300 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                        />
                        <span className="text-xs font-bold text-slate-400">
                          pts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
                    <div
                      className={`h-full transition-all duration-500 ${isError ? "bg-red-500" : isActive ? "bg-blue-500" : "bg-slate-400"}`}
                      style={{
                        width: `${cat.max > 0 ? Math.min((catSum / cat.max) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                  {isError && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse relative z-10">
                      <AlertCircle className="w-3 h-3" />{" "}
                      {t.item_sum_error
                        .replace("{sum}", catSum)
                        .replace("{max}", cat.max)}
                    </div>
                  )}

                  {/* Creating a subtle active background effect */}
                  {isActive && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-blue-100/50 to-transparent rounded-bl-[100px] -mr-8 -mt-8 z-0 pointer-events-none" />
                  )}
                </div>
              );
            })}

            <button
              onClick={() => {
                const newId = `cat_${Date.now()}`;
                setCategories([
                  ...categories,
                  { id: newId, label: "", label_en: "", max: 0 },
                ]);
                setActiveTab(newId);
              }}
              className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-400 rounded-xl font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> {t.add_category}
            </button>
          </div>
        </div>

        {/* Right: Items Editor */}
        <div className="w-full lg:w-2/3 flex flex-col h-full overflow-hidden">
          {activeCategory ? (
            <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden border-slate-200 shadow-xl bg-white/80">
              {/* ... Header inside card ... */}
              <div className="p-5 border-b border-slate-100 bg-white sticky top-0 z-20 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    {activeCategory.label || (
                      <span className="text-slate-400 italic">
                        Untitled Category
                      </span>
                    )}
                    <span className="text-sm font-normal text-slate-400">
                      ({activeCategory.label_en})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.criteria_desc}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${currentSum === activeCategory.max ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}
                  >
                    {currentSum === activeCategory.max ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {currentSum} / {activeCategory.max} pts
                  </div>
                </div>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                <div className="col-span-1 text-center">Order</div>
                <div className="col-span-3 flex items-center gap-1">
                  <Type className="w-3 h-3" /> {t.item_name_ko}
                </div>
                <div className="col-span-3 flex items-center gap-1">
                  <Type className="w-3 h-3" /> {t.item_name_en}
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {t.max_score}
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> {t.item_desc}
                </div>
                <div className="col-span-1"></div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/50">
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={categoryItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {categoryItems.map((item) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        categoryId={activeCategory.id}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        t={t}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                <button
                  onClick={handleAddItem}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-white transition-all text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {t.add_item}
                </button>
              </div>

              {/* Category Action */}
              <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
                <button
                  onClick={() => {
                    if (window.confirm(t.confirm_delete_category)) {
                      setCategories(
                        categories.filter((c) => c.id !== activeTab),
                      );
                      setItems(items.filter((i) => i.category !== activeTab));
                      setActiveTab(categories?.[0]?.id || null);
                    }
                  }}
                  className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors"
                >
                  Delete Category
                </button>
              </div>
            </GlassCard>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-2xl border-2 border-dashed border-slate-200 p-10">
              <Layers className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-bold">Select or Create a Category</p>
              <p className="text-sm">to manage evaluation criteria items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
