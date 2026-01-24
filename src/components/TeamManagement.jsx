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
const TeamToolbar = ({ onAddClick, onUpload, onDownloadTemplate }) => {
  const { t } = useContext(AppContext);
  const fileInputRef = useRef(null);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-600" /> {t.manage_teams}
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
          <Plus className="w-4 h-4" /> {t.btn_add_team}
        </button>
      </div>
    </div>
  );
};

// Sub-component: Add Team Modal/Form
const AddTeamForm = ({ onClose, onSave, initialData = null }) => {
  const { t } = useContext(AppContext);
  const [newTeam, setNewTeam] = useState(
    initialData || {
      category: "",
      name: "",
      univ: "",
      presenter: "",
      time: "",
      topic: "",
      univ_en: "",
    },
  );

  const handleSave = () => {
    if (!newTeam.name || !newTeam.univ || !newTeam.presenter) {
      alert(t.msg_fill_required);
      return;
    }
    onSave(newTeam);
  };

  return (
    <GlassCard className="p-6 border-blue-200 bg-blue-50/50 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-blue-900">
          {initialData ? t.edit_team : t.add_team_title}
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
            {t.label_category}
          </label>
          <input
            value={newTeam.category}
            onChange={(e) =>
              setNewTeam({ ...newTeam, category: e.target.value })
            }
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Student"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {t.label_team_name}
          </label>
          <input
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. DReaM"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {t.label_affiliation}
          </label>
          <input
            value={newTeam.univ}
            onChange={(e) => setNewTeam({ ...newTeam, univ: e.target.value })}
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. KOREATECH"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {t.label_presenter}
          </label>
          <input
            value={newTeam.presenter}
            onChange={(e) =>
              setNewTeam({ ...newTeam, presenter: e.target.value })
            }
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Name"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {t.label_time}
          </label>
          <input
            value={newTeam.time}
            onChange={(e) => setNewTeam({ ...newTeam, time: e.target.value })}
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 10:00~10:15"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {t.label_topic}
          </label>
          <input
            value={newTeam.topic}
            onChange={(e) => setNewTeam({ ...newTeam, topic: e.target.value })}
            className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Project Topic"
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

// Sub-component: Sortable Team Row
const SortableTeamRow = ({ team, onDelete, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

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
        {team.seq}
      </div>
      <div className="col-span-1 text-sm text-slate-600">{team.category}</div>
      <div className="col-span-2 font-bold text-slate-800">{team.name}</div>
      <div className="col-span-2 text-sm text-slate-600">{team.univ}</div>
      <div className="col-span-1 text-sm text-slate-600">{team.presenter}</div>
      <div className="col-span-1 text-xs text-slate-500">{team.time}</div>
      <div
        className="col-span-2 text-xs text-slate-500 truncate"
        title={team.topic}
      >
        {team.topic}
      </div>
      <div className="col-span-1 text-center flex justify-center gap-1">
        <button
          onClick={() => onEdit(team)}
          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(team.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Sub-component: Team List Table
const TeamList = ({ teams, onDelete, onEdit, onReorder }) => {
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
        <div className="col-span-1">{t.header_category}</div>
        <div className="col-span-2">{t.header_team}</div>
        <div className="col-span-2">{t.header_affil}</div>
        <div className="col-span-1">{t.header_presenter}</div>
        <div className="col-span-1">{t.header_time}</div>
        <div className="col-span-2">{t.header_topic}</div>
        <div className="col-span-1 text-center">{t.header_action}</div>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
        {teams.length === 0 ? (
          <div className="text-center py-20 text-slate-400">{t.no_teams}</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={teams.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {teams.map((team) => (
                <SortableTeamRow
                  key={team.id}
                  team={team}
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
export const TeamManagement = ({ teams, setTeams }) => {
  const { t } = useContext(AppContext);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const handleSaveTeam = (teamData) => {
    if (editingTeam) {
      // Update existing
      const updatedTeams = teams.map((t) =>
        t.id === editingTeam.id ? { ...t, ...teamData } : t,
      );
      setTeams(updatedTeams);
      setEditingTeam(null);
    } else {
      // Add new
      const team = {
        id: `t${Date.now()}`,
        seq: teams.length + 1,
        ...teamData,
        univ_en: teamData.univ_en || teamData.univ, // Fallback
      };
      setTeams([...teams, team]);
    }
    setIsAdding(false);
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setIsAdding(true);
  };

  const handleDeleteTeam = (id) => {
    if (window.confirm(t.msg_confirm_delete)) {
      const updatedTeams = teams
        .filter((t) => t.id !== id)
        .map((t, index) => ({
          ...t,
          seq: index + 1, // Re-sequence
        }));
      setTeams(updatedTeams);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      const newTeams = [];

      const startIndex =
        lines[0]?.includes("순서") || lines[0]?.includes("Order") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 7) {
          newTeams.push({
            id: `t${Date.now()}_${i}`,
            seq: newTeams.length + teams.length + 1,
            category: parts[1],
            name: parts[2],
            univ: parts[3],
            presenter: parts[4],
            time: parts[5],
            topic: parts[6] || "",
            univ_en: parts[3],
          });
        }
      }

      if (newTeams.length > 0) {
        const combined = [...teams, ...newTeams].map((t, idx) => ({
          ...t,
          seq: idx + 1,
        }));
        setTeams(combined);
        alert(t.msg_csv_success);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const headers = "순서,부문,팀명,소속,발표자,시간,주제";
    const sample =
      "1,학생부,DReaM,한국기술교육대,유준철,13:10~13:22,스마트 트러스 로드(SMTR)";
    const blob = new Blob([`\uFEFF${headers}\n${sample}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "team_template.csv";
    link.click();
  };

  const handleReorder = (activeId, overId) => {
    const oldIndex = teams.findIndex((t) => t.id === activeId);
    const newIndex = teams.findIndex((t) => t.id === overId);

    const newTeams = arrayMove(teams, oldIndex, newIndex).map((t, index) => ({
      ...t,
      seq: index + 1,
    }));

    setTeams(newTeams);
  };

  return (
    <div className="h-full flex flex-col">
      <TeamToolbar
        onAddClick={() => setIsAdding(true)}
        onUpload={handleCSVUpload}
        onDownloadTemplate={downloadTemplate}
      />

      {isAdding && (
        <AddTeamForm
          onClose={() => {
            setIsAdding(false);
            setEditingTeam(null);
          }}
          onSave={handleSaveTeam}
          initialData={editingTeam}
        />
      )}

      <TeamList
        teams={teams}
        onDelete={handleDeleteTeam}
        onEdit={handleEditTeam}
        onReorder={handleReorder}
      />
    </div>
  );
};
