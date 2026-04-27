"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation'
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { Project } from "@/types";
import {
  formatDate,
  PRIORITY_COLORS,
  generateAvatarColor,
  getInitials,
} from "@/lib/utils";
import {
  Plus,
  FolderKanban,
  Search,
  MoreVertical,
  Trash2,
  Edit2,
  Users,
  CheckSquare,
  Calendar,
} from "lucide-react";
import ProjectModal from "@/components/projects/ProjectModal";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data.projects);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const statusColor: Record<string, string> = {
    active: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    completed: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    "on-hold": "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    archived: "bg-slate-400/10 text-slate-400 border-slate-400/20",
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-text-secondary mt-1">
            {projects.length} projects total
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditProject(null);
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          className="input pl-10"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 card animate-pulse bg-bg-hover" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderKanban className="w-16 h-16 text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            No projects found
          </h3>
          <p className="text-text-secondary mb-6">
            {search
              ? "Try a different search"
              : "Create your first project to get started"}
          </p>
          {!search && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project) => {
            const total =
              (project.taskCounts?.todo || 0) +
              (project.taskCounts?.["in-progress"] || 0) +
              (project.taskCounts?.done || 0);
            const done = project.taskCounts?.done || 0;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={project._id}
                className="card p-5 hover:border-bg-hover transition-all group relative"
              >
                {/* Menu button — outside the Link */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-secondary opacity-0 group-hover:opacity-100 transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenMenu(
                        openMenu === project._id ? null : project._id,
                      );
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenu === project._id && (
                    <div className="absolute right-0 top-8 bg-bg-card border border-bg-border rounded-lg shadow-card min-w-[140px] z-20 py-1">
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditProject(project);
                          setShowModal(true);
                          setOpenMenu(null);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-bg-hover w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project._id);
                          setOpenMenu(null);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Entire card is clickable */}
                <div
                  className="cursor-pointer"
                  onClick={() => router.push(`/projects/${project._id}`)}
                >
                  {/* Color bar + name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: (project.color || "#8b5cf6") + "22",
                        border: `1px solid ${project.color || "#8b5cf6"}33`,
                      }}
                    >
                      <FolderKanban
                        className="w-5 h-5"
                        style={{ color: project.color || "#8b5cf6" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="font-semibold text-text-primary truncate">
                        {project.name}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                        {project.description || "No description"}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span
                      className={`badge ${statusColor[project.status] || statusColor.active}`}
                    >
                      {project.status}
                    </span>
                    <span
                      className={`badge ${PRIORITY_COLORS[project.priority]}`}
                    >
                      {project.priority}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-text-muted mb-1.5">
                      <span>
                        {done}/{total} tasks done
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: project.color || "#8b5cf6",
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-bg-border">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <div className="flex -space-x-1.5">
                        {project.members.slice(0, 3).map((m) => (
                          <div
                            key={m.user._id}
                            className="w-5 h-5 rounded-full border border-bg-card flex items-center justify-center text-xs font-bold text-white"
                            style={{
                              backgroundColor: generateAvatarColor(m.user.name),
                            }}
                          >
                            {getInitials(m.user.name)}
                          </div>
                        ))}
                        {project.members.length > 3 && (
                          <div className="w-5 h-5 rounded-full bg-bg-border border border-bg-card flex items-center justify-center text-xs text-text-muted">
                            +{project.members.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    {project.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(project.dueDate)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => setShowModal(false)}
          onSaved={(p) => {
            if (editProject) {
              setProjects((prev) => prev.map((x) => (x._id === p._id ? p : x)));
            } else {
              setProjects((prev) => [p, ...prev]);
            }
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
