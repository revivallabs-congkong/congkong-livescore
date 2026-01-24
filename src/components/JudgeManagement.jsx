import React, { useState, useRef, useContext } from "react";
import {
  Plus,
  Trash2,
  Upload,
  Download,
  Users,
  Save,
  X,
  FileText,
  UserCheck,
  Edit,
  GripVertical,
} from "lucide-react";
import { GlassCard } from "./ui";
import { AppContext } from "../context";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sub-component: Toolbar for actions
const JudgeToolbar = ({ onAddClick, onUpload, onDownloadTemplate }) => {
  const { t } = useContext(AppContext);
  const fileInputRef = useRef(null);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <UserCheck className="w-6 h-6 text-blue-600" /> {t.manage_judges}
      </h2>
      <div className="flex gap-2 w-full sm:w-auto">
        <button
          onClick={onDownloadTemplate}
          className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors text-sm font-bold cursor-pointer"
          title={t.btn_template}
        >
          <FileText className="w-4 h-4" />{" "}
          <span className="hidden sm:inline">{t.btn_template}</span>
        </button>

        <div className="relative flex-1 sm:flex-none">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={onUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full justify-center flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-colors text-sm font-bold cursor-pointer"
          >
            <Upload className="w-4 h-4" /> {t.btn_csv_upload}
          </button>
        </div>
        <button
          onClick={onAddClick}
          className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold shadow-lg shadow-blue-500/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t.btn_add_judge}
        </button>
      </div>
    </div>
  );
};

// Sub-component: Add Judge Modal/Form
const AddJudgeForm = ({ onClose, onSave, initialData = null }) => {
  const { t } = useContext(AppContext);
  const [newJudge, setNewJudge] = useState(
    initialData || {
      name: "",
      title: "",
      company: "",
      phone: "",
      email: "",
      assignedCategory: "",
    },
  );

  const handleSave = () => {
    if (!newJudge.name || !newJudge.company) {
      alert(t.msg_fill_required);
      return;
    }
    onSave(newJudge);
  };

  return (
    <GlassCard className="p-6 border-blue-200 bg-blue-50/50 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-blue-900">
          {initialData ? t.edit_judge : t.add_judge_title}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-blue-100 rounded-full text-blue-500 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {t.label_name}
          </label>
          <input
            value={newJudge.name}
            onChange={(e) => setNewJudge({ ...newJudge, name: e.target.value })}
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t.label_name}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {t.label_title}
          </label>
          <input
            value={newJudge.title}
            onChange={(e) =>
              setNewJudge({ ...newJudge, title: e.target.value })
            }
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t.label_title}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {t.label_company}
          </label>
          <input
            value={newJudge.company}
            onChange={(e) =>
              setNewJudge({ ...newJudge, company: e.target.value })
            }
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t.label_company}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {t.label_phone}
          </label>
          <input
            value={newJudge.phone}
            onChange={(e) =>
              setNewJudge({ ...newJudge, phone: e.target.value })
            }
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t.label_phone}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {t.label_email}
          </label>
          <input
            value={newJudge.email}
            onChange={(e) =>
              setNewJudge({ ...newJudge, email: e.target.value })
            }
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t.label_email}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 mb-1">
            Assigned Category
          </label>
          <input
            value={newJudge.assignedCategory || ""}
            onChange={(e) =>
              setNewJudge({ ...newJudge, assignedCategory: e.target.value })
            }
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., CA, Poster, Oral (or use Assignment Manager)"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-md cursor-pointer"
        >
          <Save className="w-4 h-4" /> {t.btn_save}
        </button>
      </div>
    </GlassCard>
  );
};

// Sub-component: Sortable Judge Row
const SortableJudgeRow = ({ judge, onDelete, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: judge.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-12 gap-4 items-center p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all ${
        isDragging ? "shadow-lg ring-2 ring-blue-500/20 z-10" : ""
      }`}
    >
      <div className="col-span-1 text-center font-mono font-bold text-slate-400 flex items-center justify-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        {judge.seq}
      </div>
      <div className="col-span-2 font-bold text-slate-800">{judge.name}</div>
      <div className="col-span-2 text-sm text-slate-600">{judge.title}</div>
      <div className="col-span-3 text-sm text-slate-600">{judge.company}</div>
      <div className="col-span-2 text-xs text-slate-500">{judge.phone}</div>
      <div
        className="col-span-1 text-xs text-slate-500 truncate"
        title={judge.email}
      >
        {judge.email}
      </div>
      <div className="col-span-1 text-center flex justify-center gap-1">
        <button
          onClick={() => onEdit(judge)}
          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(judge.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Sub-component: Judge List Table
const JudgeList = ({ judges, onDelete, onEdit, onReorder }) => {
  const { t } = useContext(AppContext);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      onReorder(active.id, over.id);
    }
  };

  return (
    <GlassCard className="flex-1 overflow-hidden flex flex-col p-0">
      <div className="p-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm grid grid-cols-12 gap-4 font-bold text-xs text-slate-500 uppercase tracking-wider sticky top-0 z-10">
        <div className="col-span-1 text-center">{t.header_seq}</div>
        <div className="col-span-2">{t.header_name}</div>
        <div className="col-span-2">{t.header_title}</div>
        <div className="col-span-3">{t.header_company}</div>
        <div className="col-span-2">{t.header_phone}</div>
        <div className="col-span-1">{t.header_email}</div>
        <div className="col-span-1 text-center">{t.header_action}</div>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
        {judges.length === 0 ? (
          <div className="text-center py-20 text-slate-400">{t.no_judges}</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={judges.map((j) => j.id)}
              strategy={verticalListSortingStrategy}
            >
              {judges.map((judge) => (
                <SortableJudgeRow
                  key={judge.id}
                  judge={judge}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </GlassCard>
  );
};

// Main Component
export const JudgeManagement = ({ judges, setJudges }) => {
  const { t } = useContext(AppContext);
  const [isAdding, setIsAdding] = useState(false);
  const [editingJudge, setEditingJudge] = useState(null);

  const handleSaveJudge = (judgeData) => {
    if (editingJudge) {
      // Update existing
      const updatedJudges = judges.map((j) =>
        j.id === editingJudge.id ? { ...j, ...judgeData } : j,
      );
      setJudges(updatedJudges);
      setEditingJudge(null);
    } else {
      // Add new
      const judge = {
        id: `j${Date.now()}`,
        seq: judges.length + 1,
        assignedCategory: "",
        ...judgeData,
      };
      setJudges([...judges, judge]);
    }
    setIsAdding(false);
  };

  const handleEditJudge = (judge) => {
    setEditingJudge(judge);
    setIsAdding(true);
  };

  const handleDeleteJudge = (id) => {
    if (window.confirm(t.msg_confirm_delete)) {
      const updatedJudges = judges
        .filter((j) => j.id !== id)
        .map((j, index) => ({
          ...j,
          seq: index + 1, // Re-sequence
        }));
      setJudges(updatedJudges);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      const newJudges = [];

      const startIndex =
        lines[0]?.includes("번호") || lines[0]?.includes("Seq") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(",").map((p) => p.trim());
        // Format: 번호,성함,직함,소속,핸드폰번호,이메일
        if (parts.length >= 2) {
          newJudges.push({
            id: `j${Date.now()}_${i}`,
            seq: newJudges.length + judges.length + 1,
            name: parts[1],
            title: parts[2] || "",
            company: parts[3] || "",
            phone: parts[4] || "",
            email: parts[5] || "",
          });
        }
      }

      if (newJudges.length > 0) {
        const combined = [...judges, ...newJudges].map((j, idx) => ({
          ...j,
          seq: idx + 1,
        }));
        setJudges(combined);
        alert(t.msg_judge_csv_success);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const headers = "번호,성함,직함,소속,핸드폰번호,이메일";
    const sample = "1,홍길동,교수,한국대학교,010-1234-5678,hong@example.com";
    const blob = new Blob([`\uFEFF${headers}\n${sample}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "judge_template.csv";
    link.click();
  };

  const handleReorder = (activeId, overId) => {
    const oldIndex = judges.findIndex((j) => j.id === activeId);
    const newIndex = judges.findIndex((j) => j.id === overId);

    const newJudges = arrayMove(judges, oldIndex, newIndex).map((j, index) => ({
      ...j,
      seq: index + 1,
    }));

    setJudges(newJudges);
  };

  return (
    <div className="h-full flex flex-col">
      <JudgeToolbar
        onAddClick={() => setIsAdding(true)}
        onUpload={handleCSVUpload}
        onDownloadTemplate={downloadTemplate}
      />

      {isAdding && (
        <AddJudgeForm
          onClose={() => {
            setIsAdding(false);
            setEditingJudge(null);
          }}
          onSave={handleSaveJudge}
          initialData={editingJudge}
        />
      )}

      <JudgeList
        judges={judges}
        onDelete={handleDeleteJudge}
        onEdit={handleEditJudge}
        onReorder={handleReorder}
      />
    </div>
  );
};
