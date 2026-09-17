"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Edit,
  ExternalLink,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  Globe,
  FileText,
  AlertCircle,
  MoreVertical,
  Check,
  Award,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  DollarSign,
  ChevronRight,
  X
} from "lucide-react";
import { Github, Linkedin, Twitter } from "@/components/icons";
import {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  getJobApplications,
  updateJobApplicationStatus,
  deleteJobApplication,
  JobPosting,
  JobPostingInput,
  JobApplication,
  JobApplicationStatus,
} from "@/lib/supabase";

export default function AdminCareersPage() {
  const [activeTab, setActiveTab] = useState<"applicants" | "jobs">("applicants");

  // Job Postings State
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobSearch, setJobSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  // Job Modal State (Create / Edit)
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState<JobPostingInput>({
    title: "",
    department: "Engineering",
    location: "Remote (India)",
    type: "Full-time",
    experience: "1-3 years",
    stipend_salary: "₹8 LPA - ₹14 LPA",
    description: "",
    responsibilities: [""],
    requirements: [""],
    perks: [""],
    is_active: true
  });
  const [savingJob, setSavingJob] = useState(false);

  // Applications State
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appSearch, setAppSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Applicant Detail Modal State
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const loadData = async () => {
    setLoadingJobs(true);
    setLoadingApps(true);

    const [jobsData, appsData] = await Promise.all([
      getJobs(true), // include inactive
      getJobApplications()
    ]);

    setJobs(jobsData);
    setApplications(appsData);
    setLoadingJobs(false);
    setLoadingApps(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── JOB POSTING CRUD HANDLERS ──────────────────────────────────────────────────
  const handleOpenCreateJob = () => {
    setEditingJobId(null);
    setJobForm({
      title: "",
      department: "Engineering",
      location: "Remote (India)",
      type: "Full-time",
      experience: "1-3 years",
      stipend_salary: "₹8 LPA - ₹15 LPA",
      description: "",
      responsibilities: ["Lead design and implementation of responsive web features."],
      requirements: ["Strong proficiency with React, TypeScript, and TailwindCSS."],
      perks: ["100% remote flexibility", "Competitive compensation & equity"],
      is_active: true
    });
    setJobModalOpen(true);
  };

  const handleOpenEditJob = (job: JobPosting) => {
    setEditingJobId(job.id);
    setJobForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      experience: job.experience,
      stipend_salary: job.stipend_salary,
      description: job.description,
      responsibilities: job.responsibilities && job.responsibilities.length > 0 ? job.responsibilities : [""],
      requirements: job.requirements && job.requirements.length > 0 ? job.requirements : [""],
      perks: job.perks && job.perks.length > 0 ? job.perks : [""],
      is_active: job.is_active
    });
    setJobModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title.trim() || !jobForm.description.trim()) {
      showToast("Please fill in job title and description.");
      return;
    }

    setSavingJob(true);
    const cleanedPayload: JobPostingInput = {
      ...jobForm,
      responsibilities: jobForm.responsibilities.filter(r => r.trim() !== ""),
      requirements: jobForm.requirements.filter(r => r.trim() !== ""),
      perks: jobForm.perks.filter(p => p.trim() !== "")
    };

    if (editingJobId) {
      const res = await updateJob(editingJobId, cleanedPayload);
      if (res.success) {
        showToast("Job posting updated successfully! ✅");
        setJobModalOpen(false);
        loadData();
      } else {
        showToast(res.error || "Failed to update job.");
      }
    } else {
      const res = await createJob(cleanedPayload);
      if (res.success) {
        showToast("New job posting created successfully! 🚀");
        setJobModalOpen(false);
        loadData();
      } else {
        showToast(res.error || "Failed to create job.");
      }
    }
    setSavingJob(false);
  };

  const handleToggleJobActive = async (job: JobPosting) => {
    const updated = await updateJob(job.id, { is_active: !job.is_active });
    if (updated.success) {
      showToast(`Job ${job.is_active ? "paused" : "activated"} successfully.`);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_active: !j.is_active } : j));
    }
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    const res = await deleteJob(id);
    if (res.success) {
      showToast("Job posting deleted.");
      setJobs(prev => prev.filter(j => j.id !== id));
    }
  };

  // ── APPLICANT CRUD HANDLERS ───────────────────────────────────────────────────
  const handleOpenAppDetail = (app: JobApplication) => {
    setSelectedApp(app);
    setAdminNotes(app.admin_notes || "");
  };

  const handleUpdateStatus = async (id: string, newStatus: JobApplicationStatus) => {
    setUpdatingStatus(true);
    const res = await updateJobApplicationStatus(id, newStatus, adminNotes);
    setUpdatingStatus(false);

    if (res.success) {
      showToast(`Application marked as ${newStatus}.`);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus, admin_notes: adminNotes } : a));
      if (selectedApp?.id === id) {
        setSelectedApp(prev => prev ? { ...prev, status: newStatus, admin_notes: adminNotes } : null);
      }
    } else {
      showToast("Failed to update status.");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setUpdatingStatus(true);
    const res = await updateJobApplicationStatus(selectedApp.id, selectedApp.status, adminNotes);
    setUpdatingStatus(false);
    if (res.success) {
      showToast("Admin notes saved.");
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, admin_notes: adminNotes } : a));
    }
  };

  const handleDeleteApp = async (id: string, candidateName: string) => {
    if (!confirm(`Delete application from ${candidateName}?`)) return;
    const res = await deleteJobApplication(id);
    if (res.success) {
      showToast("Application deleted.");
      setApplications(prev => prev.filter(a => a.id !== id));
      if (selectedApp?.id === id) setSelectedApp(null);
    }
  };

  // Status badge styling
  const getStatusBadge = (st: JobApplicationStatus) => {
    switch (st) {
      case "pending":
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[11px] font-bold">Pending</span>;
      case "reviewing":
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[11px] font-bold">Reviewing</span>;
      case "shortlisted":
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 text-[11px] font-bold">Shortlisted ⭐</span>;
      case "hired":
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-bold">Hired 🎉</span>;
      case "rejected":
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[11px] font-bold">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">{st}</span>;
    }
  };

  // Filtered lists
  const filteredJobs = jobs.filter(j => {
    const matchDept = selectedDept === "All" || j.department.toLowerCase().includes(selectedDept.toLowerCase());
    const q = jobSearch.toLowerCase().trim();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.department.toLowerCase().includes(q);
    return matchDept && matchSearch;
  });

  const filteredApps = applications.filter(a => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchRole = roleFilter === "all" || a.role_title === roleFilter;
    const q = appSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      a.full_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.phone_number.toLowerCase().includes(q) ||
      a.current_location.toLowerCase().includes(q) ||
      a.role_title.toLowerCase().includes(q);
    return matchStatus && matchRole && matchSearch;
  });

  // App metrics
  const pendingCount = applications.filter(a => a.status === "pending").length;
  const reviewingCount = applications.filter(a => a.status === "reviewing").length;
  const shortlistedCount = applications.filter(a => a.status === "shortlisted").length;
  const hiredCount = applications.filter(a => a.status === "hired").length;
  const rejectedCount = applications.filter(a => a.status === "rejected").length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Careers & Job Openings
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage IndiHunt job listings, review applicant submissions, and track candidate pipeline.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/careers"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Live Careers Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {activeTab === "jobs" && (
            <button
              onClick={handleOpenCreateJob}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Job</span>
            </button>
          )}
        </div>
      </div>

      {/* ── METRIC STAT CARDS ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Apps</div>
          <div className="text-xl font-black text-slate-900">{applications.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Pending</div>
          <div className="text-xl font-black text-amber-700">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Reviewing</div>
          <div className="text-xl font-black text-blue-700">{reviewingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/60 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">Shortlisted</div>
          <div className="text-xl font-black text-purple-700">{shortlistedCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Hired</div>
          <div className="text-xl font-black text-emerald-700">{hiredCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/60 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Rejected</div>
          <div className="text-xl font-black text-rose-700">{rejectedCount}</div>
        </div>
      </div>

      {/* ── DUAL TAB SWITCHER ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("applicants")}
          className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "applicants"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Job Applications</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
            {applications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("jobs")}
          className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "jobs"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Job Postings</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
            {jobs.length}
          </span>
        </button>
      </div>

      {/* ── TAB 1: JOB APPLICATIONS ──────────────────────────────────────────────── */}
      {activeTab === "applicants" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by candidate name, email, role, city..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                {Array.from(new Set(applications.map(a => a.role_title))).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            {loadingApps ? (
              <div className="py-16 text-center text-xs text-slate-400 font-semibold">
                Loading applications...
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-700">No applications match your criteria</div>
                <div className="text-[11px] text-slate-400">Applications submitted from /careers/apply will appear here in real-time.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-5">Candidate</th>
                      <th className="py-3.5 px-4">Applied Role</th>
                      <th className="py-3.5 px-4">Location</th>
                      <th className="py-3.5 px-4">Exp / Notice</th>
                      <th className="py-3.5 px-4">Expected CTC</th>
                      <th className="py-3.5 px-4">Resume</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {app.full_name[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() => handleOpenAppDetail(app)}
                                className="font-bold text-slate-900 hover:text-orange-500 transition-colors text-left truncate block cursor-pointer"
                              >
                                {app.full_name}
                              </button>
                              <div className="text-[11px] text-slate-400 truncate">{app.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block truncate max-w-[180px]">{app.role_title}</span>
                          <span className="text-[10px] text-slate-400">{new Date(app.created_at).toLocaleDateString("en-IN")}</span>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <span className="truncate block max-w-[130px]">{app.current_location}</span>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <div>{app.experience_years}</div>
                          <div className="text-[10px] text-slate-400">{app.notice_period}</div>
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900">
                          {app.expected_ctc}
                        </td>

                        <td className="py-3 px-4">
                          {app.resume_url ? (
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-[11px] transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View PDF</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">No file</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={app.status}
                            onChange={(e) => handleUpdateStatus(app.id, e.target.value as JobApplicationStatus)}
                            className="text-[11px] font-bold rounded-lg border border-slate-200 bg-white px-2 py-1 focus:outline-none cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="shortlisted">Shortlisted ⭐</option>
                            <option value="hired">Hired 🎉</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAppDetail(app)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                              title="View full application"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteApp(app.id, app.full_name)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete application"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: JOB POSTINGS MANAGEMENT ───────────────────────────────────────── */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          {/* Search + Filter Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search jobs by title, department, location..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Growth & Marketing">Growth & Marketing</option>
                <option value="Community & DevRel">Community & DevRel</option>
                <option value="Design">Design</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>

          {/* Job Postings Grid */}
          {loadingJobs ? (
            <div className="py-16 text-center text-xs text-slate-400 font-semibold">
              Loading jobs...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-3">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-bold text-slate-700">No jobs found</div>
              <button
                onClick={handleOpenCreateJob}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold"
              >
                Create Job
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className={`bg-white border rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs hover:shadow-md transition-all ${
                    job.is_active ? "border-slate-200" : "border-slate-200/60 opacity-60 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{job.title}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold">
                          {job.department}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>📍 {job.location}</span>
                        <span>⏱️ {job.type}</span>
                        <span>💰 {job.stipend_salary}</span>
                      </div>
                    </div>

                    {/* Active toggle button */}
                    <button
                      onClick={() => handleToggleJobActive(job)}
                      className={`p-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        job.is_active ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"
                      }`}
                      title={job.is_active ? "Click to Pause" : "Click to Activate"}
                    >
                      {job.is_active ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Experience: <strong className="text-slate-700">{job.experience}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/careers/apply?role=${job.id}`}
                        target="_blank"
                        className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 flex items-center gap-1"
                        title="View apply page"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Apply URL</span>
                      </Link>

                      <button
                        onClick={() => handleOpenEditJob(job)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Edit Job"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteJob(job.id, job.title)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT JOB ─────────────────────────────────────────────── */}
      {jobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingJobId ? "Edit Job Posting" : "Create New Job Opening"}
                </h3>
                <p className="text-xs text-slate-400">Add or edit position details visible to all candidates.</p>
              </div>
              <button
                onClick={() => setJobModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={jobForm.title}
                    onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={jobForm.department}
                    onChange={(e) => setJobForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Growth & Marketing">Growth & Marketing</option>
                    <option value="Community & DevRel">Community & DevRel</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Job Type *</label>
                  <select
                    value={jobForm.type}
                    onChange={(e) => setJobForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Remote (India) or Bengaluru"
                    value={jobForm.location}
                    onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Experience Required *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1-3 years or Freshers"
                    value={jobForm.experience}
                    onChange={(e) => setJobForm(prev => ({ ...prev, experience: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salary / Stipend Range *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹8 LPA - ₹15 LPA or ₹20,000/mo"
                    value={jobForm.stipend_salary}
                    onChange={(e) => setJobForm(prev => ({ ...prev, stipend_salary: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Overview of the position, mission, and day-to-day impact..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Responsibilities (1 item per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Architect and ship responsive UI...&#10;Develop secure Supabase PostgreSQL schemas..."
                  value={jobForm.responsibilities.join("\n")}
                  onChange={(e) => setJobForm(prev => ({ ...prev, responsibilities: e.target.value.split("\n") }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Requirements (1 item per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Strong proficiency with React and TypeScript...&#10;Solid understanding of PostgreSQL..."
                  value={jobForm.requirements.join("\n")}
                  onChange={(e) => setJobForm(prev => ({ ...prev, requirements: e.target.value.split("\n") }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Perks */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Perks & Benefits (1 item per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="100% remote flexibility...&#10;Equity / ESOPs in IndiHunt..."
                  value={jobForm.perks.join("\n")}
                  onChange={(e) => setJobForm(prev => ({ ...prev, perks: e.target.value.split("\n") }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setJobModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingJob}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingJob ? "Saving..." : editingJobId ? "Update Job" : "Create Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: APPLICANT FULL DETAILS ────────────────────────────────────────── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {selectedApp.full_name[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedApp.full_name}</h3>
                  <div className="text-xs text-slate-500">Applied for <strong className="text-slate-800">{selectedApp.role_title}</strong></div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Submitted on {new Date(selectedApp.created_at).toLocaleString("en-IN")}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(selectedApp.status)}
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Contact & Compensation Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Email</span>
                <a href={`mailto:${selectedApp.email}`} className="font-semibold text-orange-600 hover:underline truncate block">
                  {selectedApp.email}
                </a>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Phone</span>
                <a href={`tel:${selectedApp.phone_number}`} className="font-semibold text-slate-800 hover:underline">
                  {selectedApp.phone_number}
                </a>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Location</span>
                <span className="font-semibold text-slate-800">{selectedApp.current_location}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Notice Period</span>
                <span className="font-semibold text-slate-800">{selectedApp.notice_period}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Experience</span>
                <span className="font-semibold text-slate-800">{selectedApp.experience_years}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current CTC</span>
                <span className="font-semibold text-slate-800">{selectedApp.current_ctc || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Expected CTC</span>
                <span className="font-bold text-emerald-600">{selectedApp.expected_ctc}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Resume</span>
                {selectedApp.resume_url ? (
                  <a
                    href={selectedApp.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-orange-500 hover:underline inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>
                ) : (
                  <span className="text-slate-400">None</span>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedApp.linkedin_url && (
                <a
                  href={selectedApp.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
              {selectedApp.github_url && (
                <a
                  href={selectedApp.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Profile</span>
                </a>
              )}
              {selectedApp.portfolio_url && (
                <a
                  href={selectedApp.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Portfolio Site</span>
                </a>
              )}
              {selectedApp.twitter_url && (
                <a
                  href={selectedApp.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span>X (Twitter)</span>
                </a>
              )}
            </div>

            {/* Candidate Pitch / Cover Note */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Why IndiHunt Pitch & Intro</h4>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedApp.cover_note}
              </div>
            </div>

            {/* Admin Notes & Status Updater */}
            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                  <span>Hiring Pipeline Stage</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["pending", "reviewing", "shortlisted", "hired", "rejected"] as JobApplicationStatus[]).map((st) => (
                    <button
                      key={st}
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedApp.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        selectedApp.status === st
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Internal Admin Notes</label>
                <textarea
                  rows={2}
                  placeholder="Add notes about interview feedback, test task evaluation, or offer details..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={updatingStatus}
                  className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
