"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Briefcase,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Sparkles,
  MapPin,
  Clock,
  Award,
  Globe,
  DollarSign,
  Calendar,
  X,
  ShieldCheck,
} from "lucide-react";
import { Github, Linkedin, Twitter } from "@/components/icons";
import {
  getJobs,
  getJobById,
  submitJobApplication,
  uploadResumeFile,
  JobPosting,
} from "@/lib/supabase";

function ApplyFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleParam = searchParams.get("role") || searchParams.get("jobId") || "";

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [roleTitle, setRoleTitle] = useState<string>("");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [currentCtc, setCurrentCtc] = useState("");
  const [expectedCtc, setExpectedCtc] = useState("");
  const [experienceYears, setExperienceYears] = useState("Fresher");
  const [noticePeriod, setNoticePeriod] = useState("Immediate");
  const [coverNote, setCoverNote] = useState("");

  // Resume Upload State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [resumeFilename, setResumeFilename] = useState<string>("");
  const [uploadingResume, setUploadingResume] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    async function loadJobData() {
      const activeJobs = await getJobs();
      setJobs(activeJobs);

      if (roleParam) {
        // Try match by ID or slug/title
        const match = activeJobs.find(
          (j) => j.id === roleParam || j.title.toLowerCase() === roleParam.toLowerCase()
        );
        if (match) {
          setSelectedJob(match);
          setRoleTitle(match.title);
        } else {
          // If custom role param string
          setRoleTitle(roleParam);
        }
      } else if (activeJobs.length > 0) {
        setSelectedJob(activeJobs[0]);
        setRoleTitle(activeJobs[0].title);
      }
    }
    loadJobData();
  }, [roleParam]);

  const handleJobSelect = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setRoleTitle(job.title);
    } else {
      setSelectedJob(null);
      setRoleTitle(jobId);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    // Validate type
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setUploadError("Only PDF, DOC, and DOCX files are allowed.");
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Resume exceeds maximum size of 5MB. Please upload a smaller file.");
      return;
    }

    setResumeFile(file);
    setResumeFilename(file.name);
    setUploadingResume(true);

    const uploadRes = await uploadResumeFile(file);
    setUploadingResume(false);

    if (uploadRes.error) {
      setUploadError(uploadRes.error);
    } else if (uploadRes.url) {
      setResumeUrl(uploadRes.url);
      setResumeFilename(uploadRes.filename || file.name);
    }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeUrl("");
    setResumeFilename("");
    setUploadError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !coverNote.trim() || !expectedCtc.trim() || !currentLocation.trim()) {
      setErrorMessage("Please fill in all required fields marked with an asterisk (*).");
      return;
    }

    if (!resumeUrl && !resumeFile) {
      setErrorMessage("Please upload your resume (PDF or DOCX format).");
      return;
    }

    setIsSubmitting(true);

    let finalResumeUrl = resumeUrl;
    let finalResumeFilename = resumeFilename;

    // If file was selected but not uploaded yet
    if (!finalResumeUrl && resumeFile) {
      const uploadRes = await uploadResumeFile(resumeFile);
      if (uploadRes.url) {
        finalResumeUrl = uploadRes.url;
        finalResumeFilename = uploadRes.filename || resumeFile.name;
      }
    }

    const res = await submitJobApplication({
      job_id: selectedJob?.id || null,
      role_title: roleTitle || selectedJob?.title || "General Application",
      full_name: fullName.trim(),
      email: email.trim(),
      phone_number: phoneNumber.trim(),
      current_location: currentLocation.trim(),
      linkedin_url: linkedinUrl.trim(),
      github_url: githubUrl.trim(),
      portfolio_url: portfolioUrl.trim(),
      twitter_url: twitterUrl.trim(),
      current_ctc: currentCtc.trim(),
      expected_ctc: expectedCtc.trim(),
      experience_years: experienceYears,
      notice_period: noticePeriod,
      cover_note: coverNote.trim(),
      resume_url: finalResumeUrl,
      resume_filename: finalResumeFilename,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSubmittedSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setErrorMessage(res.error || "Failed to submit application. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#ff5733] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 sm:pt-36 pb-24">
        {/* Back navigation */}
        <Link
          href="/careers#openings"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to All Openings</span>
        </Link>

        {submittedSuccess ? (
          /* ── SUCCESS VIEW ────────────────────────────────────────────────────────── */
          <div className="p-8 sm:p-12 bg-card border border-border rounded-3xl text-center space-y-6 shadow-xl max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Application Received! 🚀
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                Thank you for applying for{" "}
                <span className="font-semibold text-foreground">{roleTitle}</span>. Our hiring team
                will review your profile and reach out to{" "}
                <span className="font-semibold text-orange-500">{email}</span> within 48 hours.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-left text-xs text-muted-foreground space-y-2 max-w-md mx-auto">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>What happens next?</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-muted-foreground">
                <li>Initial review of your portfolio, GitHub, and resume.</li>
                <li>Quick 20-minute intro call with the team.</li>
                <li>Practical task or architectural discussion.</li>
                <li>Offer letter & onboarding!</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/careers"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors text-center"
              >
                View Other Openings
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-bold shadow-md transition-all text-center"
              >
                Explore Top Launches
              </Link>
            </div>
          </div>
        ) : (
          /* ── APPLICATION FORM ────────────────────────────────────────────────────── */
          <div className="space-y-8">
            {/* Header / Role Selector */}
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Job Application Portal</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  Join the IndiHunt Team
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  We are building the daily launchpad for Indian software makers. Complete your application below to build the future of India's tech ecosystem with us.
                </p>
              </div>

              {/* Role Selection Dropdown */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Position You Are Applying For *
                </label>
                <select
                  value={selectedJob?.id || roleTitle}
                  onChange={(e) => handleJobSelect(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-semibold text-foreground focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} — {job.department} ({job.type})
                    </option>
                  ))}
                  <option value="General Application / Other">
                    General Application (Other / Creator / Specialist)
                  </option>
                </select>
              </div>

              {/* Active Role Meta Card */}
              {selectedJob && (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>{selectedJob.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{selectedJob.type} • {selectedJob.experience}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{selectedJob.stipend_salary}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Main Application Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1. Basic Details */}
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <h3 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 text-xs flex items-center justify-center font-extrabold">1</span>
                  <span>Personal & Contact Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Phone Number (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Current City / Location *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bengaluru, Karnataka"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Professional Profiles & Links */}
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <h3 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 text-xs flex items-center justify-center font-extrabold">2</span>
                  <span>Socials, Portfolio & Links</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                      <span>LinkedIn Profile URL *</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-purple-400" />
                      <span>GitHub Profile URL</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/yourusername"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Portfolio / Personal Website</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourportfolio.dev"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5 flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5 text-sky-400" />
                      <span>X (Twitter) Profile URL</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://x.com/yourhandle"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Compensation & Availability */}
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <h3 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 text-xs flex items-center justify-center font-extrabold">3</span>
                  <span>Experience & Compensation Expectations</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Total Relevant Experience *
                    </label>
                    <select
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      <option value="Fresher / College Student">Fresher / College Student</option>
                      <option value="0–1 Year">0–1 Year</option>
                      <option value="1–3 Years">1–3 Years</option>
                      <option value="3–5 Years">3–5 Years</option>
                      <option value="5+ Years">5+ Years</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Notice Period / Availability *
                    </label>
                    <select
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      <option value="Immediate (Within 7 Days)">Immediate (Within 7 Days)</option>
                      <option value="15 Days">15 Days</option>
                      <option value="1 Month">1 Month</option>
                      <option value="2 Months">2 Months</option>
                      <option value="Serving Notice">Currently Serving Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Current CTC / Previous Salary (or Stipend)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹5 LPA, ₹15,000/mo, or N/A (Fresher)"
                      value={currentCtc}
                      onChange={(e) => setCurrentCtc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                      Expected CTC / Monthly Stipend *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ₹20,000/month or ₹8-10 LPA"
                      value={expectedCtc}
                      onChange={(e) => setExpectedCtc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Resume Upload & Pitch */}
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <h3 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 text-xs flex items-center justify-center font-extrabold">4</span>
                  <span>Resume & Why IndiHunt?</span>
                </h3>

                {/* Resume Upload Box */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                    Upload Resume (PDF, DOC, DOCX — Max 5MB) *
                  </label>

                  {resumeFilename ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">{resumeFilename}</div>
                          <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready for submission
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveResume}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Remove resume"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="relative border-2 border-dashed border-border/80 hover:border-orange-500/60 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all bg-muted/20 hover:bg-muted/40">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {uploadingResume ? "Reading resume file..." : "Click to upload or drag & drop your resume"}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          PDF, DOC, DOCX (Maximum file size: 5MB)
                        </div>
                      </div>
                    </label>
                  )}

                  {uploadError && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
                    </p>
                  )}
                </div>

                {/* Pitch / Cover Note */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
                    Why are you excited about joining IndiHunt? *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us briefly about yourself, your interest in Indian indie hackers, relevant projects you've shipped, and how you will make an impact at IndiHunt..."
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 resize-none leading-relaxed transition-colors"
                  />
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Tip: Be authentic! Share real links, live side projects, or ideas you have to improve IndiHunt.
                  </div>
                </div>
              </div>

              {/* Submit Button Bar */}
              <div className="p-6 bg-card border border-border rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div className="text-xs text-muted-foreground text-center sm:text-left">
                  By submitting, you agree to our recruitment review and verification guidelines.
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href="/careers"
                    className="w-1/2 sm:w-auto px-5 py-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted text-center transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting || uploadingResume}
                    className="w-1/2 sm:w-auto px-7 py-3 rounded-xl bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span>Submitting Application...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ApplyFormContent />
    </Suspense>
  );
}
