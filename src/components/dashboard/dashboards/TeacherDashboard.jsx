import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  Users,
  ClipboardList,
  CalendarCheck,
  ArrowRight,
  Plus,
  FileBarChart,
  NotebookPen,
  Loader2,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useApiV1Mutation } from "@/hooks/useIportalQuery";
import { lessonNoteSchema, applyLaravelValidationErrors } from "@/lib/laravelValidation";
import StatCard from "./StatCard";
import FormDrawer from "@/components/admin/FormDrawer";
import RecentAnnouncements from "@/components/communication/RecentAnnouncements";

const inputCls =
  "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-xs font-semibold text-foreground mb-1 block uppercase tracking-wide";

export default function TeacherDashboard() {
  const { user, schoolId } = useCurrentUser();
  const [noteDrawerOpen, setNoteDrawerOpen] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteSaved, setNoteSaved] = useState("");

  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ["teacher-dashboard", schoolId, user?.id],
    enabled: !!user?.id && !!schoolId,
    queryFn: async () => {
      const teachers = await base44.entities.Teacher.filter({ user_id: user.id }, "-created_date", 5);
      const myTeacher = (teachers || [])[0];
      let myAssignments = [];
      if (myTeacher) {
        myAssignments = await base44.entities.TeacherAssignment.filter(
          { school_id: schoolId, teacher_id: myTeacher.id },
          "-created_date",
          200
        );
      } else {
        myAssignments = await base44.entities.TeacherAssignment.filter({ school_id: schoolId }, "-created_date", 50);
      }

      const [drafts, hwList, submissions] = await Promise.all([
        base44.entities.Result.filter({ school_id: schoolId, status: "draft" }, "-created_date", 200).catch(() => []),
        base44.entities.Assignment.filter({ school_id: schoolId }, "-created_date", 50).catch(() => []),
        base44.entities.AssignmentSubmission.filter({ school_id: schoolId }, "-created_date", 50).catch(() => []),
      ]);

      const classIds = [...new Set((myAssignments || []).map((a) => a.class_id).filter(Boolean))];
      let totalStudents = 0;
      for (const cid of classIds) {
        const stu = await base44.entities.ClassAssignment.filter({ school_id: schoolId, class_id: cid }, "-created_date", 200).catch(
          () => []
        );
        totalStudents += (stu || []).length;
      }

      return {
        teacher: myTeacher,
        assignments: myAssignments || [],
        pendingResults: (drafts || []).length,
        studentCount: totalStudents,
        homeworkList: hwList || [],
        submissions: submissions || [],
      };
    },
  });

  const assignments = dashboardData?.assignments || [];
  const pendingResults = dashboardData?.pendingResults || 0;
  const studentCount = dashboardData?.studentCount || 0;
  const homeworkList = dashboardData?.homeworkList || [];
  const submissions = dashboardData?.submissions || [];

  const byClass = {};
  assignments.forEach((a) => {
    const cid = a.class_id || "default";
    if (!byClass[cid]) byClass[cid] = { id: a.class_id, name: a.class_name || "Assigned Class", subjects: [] };
    if (a.subject_name && !byClass[cid].subjects.includes(a.subject_name)) {
      byClass[cid].subjects.push(a.subject_name);
    }
  });
  const classList = Object.entries(byClass);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(lessonNoteSchema),
    defaultValues: {
      class_id: "",
      subject_name: "",
      week_number: "Week 1",
      topic: "",
      objectives: "",
    },
  });

  const createLessonNoteMutation = useApiV1Mutation(
    (payload) => base44.entities.Assignment.create(payload),
    [["teacher-dashboard", schoolId, user?.id]]
  );

  const onSubmitLessonNote = async (values) => {
    setNoteError("");
    setNoteSaved("");
    try {
      await createLessonNoteMutation.mutateAsync({
        school_id: schoolId,
        class_id: Number(values.class_id) || undefined,
        title: `[Lesson Note · ${values.week_number}] ${values.subject_name}: ${values.topic}`,
        description: values.objectives,
        status: "published",
        due_date: new Date().toISOString().slice(0, 10),
      });
      setNoteSaved("Lesson note published and shared with class!");
      reset();
      setTimeout(() => {
        setNoteDrawerOpen(false);
        setNoteSaved("");
      }, 1200);
    } catch (err) {
      const msg = applyLaravelValidationErrors(err, setError);
      setNoteError(msg);
    }
  };

  const quickActions = [
    { label: "Class Attendance", icon: CalendarCheck, path: "/app/attendance" },
    { label: "Grade Entry Sheet", icon: FileBarChart, path: "/app/result-entry" },
    { label: "New Lesson Note", icon: NotebookPen, onClick: () => setNoteDrawerOpen(true) },
    { label: "Assignments & Submissions", icon: ClipboardList, path: "/app/assignments" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(15 85% 48%))" }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Teacher Academic Workspace</p>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">
              Welcome back, {user?.full_name || "Teacher"}
            </h2>
            <p className="text-white/80 max-w-xl">
              Manage daily class attendance, CA + Exam grade entry sheets, weekly lesson notes, and student assignment submissions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to="/app/attendance"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold"
            >
              <CalendarCheck className="w-4 h-4" /> Take Attendance
            </Link>
            <Link
              to="/app/result-entry"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white text-slate-900 hover:bg-white/90 text-xs font-bold shadow"
            >
              <FileBarChart className="w-4 h-4" /> Grade Entry Sheet
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Assigned Classes" value={String(classList.length)} color="orange" />
        <StatCard icon={Users} label="Enrolled Students" value={String(studentCount)} color="indigo" />
        <StatCard icon={FileBarChart} label="Draft Grade Entries" value={String(pendingResults)} color="red" />
        <StatCard icon={FileCheck2} label="Submissions & Notes" value={String(submissions.length + homeworkList.length)} color="green" />
      </div>

      {/* Class Attendance + Grade Entry Sheet + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">Class Attendance &amp; Grade Entry Sheets</h3>
              <p className="text-xs text-muted-foreground">Jump directly to roll-call or CA/Exam score entry for your allocated classes.</p>
            </div>
            <Link
              to="/app/teacher/classes"
              className="text-sm font-semibold text-[hsl(var(--brand-orange))] flex items-center gap-1 hover:gap-2 transition-all"
            >
              All classes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {classList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No class assignments yet. Contact your school administrator.
            </p>
          ) : (
            <div className="space-y-2.5">
              {classList.map(([id, info]) => (
                <div
                  key={id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-orange))]/30 hover:bg-[hsl(var(--brand-orange))]/5 transition-all"
                >
                  <div>
                    <p className="font-semibold text-foreground text-sm">{info.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Subjects: {info.subjects.length > 0 ? info.subjects.join(", ") : "General Class Teacher"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to="/app/attendance"
                      className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-foreground"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" /> Attendance
                    </Link>
                    <Link
                      to="/app/result-entry"
                      className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-[hsl(var(--brand-orange))]/15 hover:bg-[hsl(var(--brand-orange))]/25 text-xs font-semibold text-[hsl(var(--brand-orange))]"
                    >
                      <FileBarChart className="w-3.5 h-3.5" /> Grade Sheet
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <h3 className="font-heading font-bold text-lg text-foreground mb-4">Teacher Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              if (a.onClick) {
                return (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.onClick}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-orange))]/40 hover:bg-[hsl(var(--brand-orange))]/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[hsl(var(--brand-orange))]/10 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-[hsl(var(--brand-orange))]" />
                    </div>
                    <span className="text-xs font-medium text-foreground text-center">{a.label}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={a.label}
                  to={a.path}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-orange))]/40 hover:bg-[hsl(var(--brand-orange))]/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[hsl(var(--brand-orange))]/10 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-[hsl(var(--brand-orange))]" />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center">{a.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lesson Notes & Assignment Submissions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lesson Notes & Syllabus Tracker */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <NotebookPen className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
              <h3 className="font-heading font-bold text-base text-foreground">Lesson Notes &amp; Coursework</h3>
            </div>
            <button
              type="button"
              onClick={() => setNoteDrawerOpen(true)}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[hsl(var(--brand-indigo))]/10 hover:bg-[hsl(var(--brand-indigo))]/20 text-[hsl(var(--brand-indigo))] text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Lesson Note
            </button>
          </div>
          {homeworkList.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No lesson notes or coursework published yet. Click &ldquo;Add Lesson Note&rdquo; to create one.
            </p>
          ) : (
            <div className="space-y-2.5">
              {homeworkList.slice(0, 4).map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-xs text-foreground truncate">{item.title}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 shrink-0">
                      {item.status || "published"}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignment Submissions Review */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-heading font-bold text-base text-foreground">Recent Assignment Submissions</h3>
            </div>
            <Link
              to="/app/assignments"
              className="text-xs font-semibold text-[hsl(var(--brand-orange))] hover:underline flex items-center gap-1"
            >
              Grade all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {submissions.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-muted-foreground mb-3">No student assignment submissions awaiting review.</p>
              <Link
                to="/app/assignments"
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-foreground"
              >
                Manage Class Assignments <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {submissions.slice(0, 4).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-border/50 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{sub.student_name || `Student #${sub.student_id}`}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{sub.assignment_title || "Coursework Submission"}</p>
                  </div>
                  <Link
                    to="/app/assignments"
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 shrink-0"
                  >
                    {sub.score !== null && sub.score !== undefined ? `Scored: ${sub.score}` : "Review"}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <RecentAnnouncements maxItems={3} />

      {/* Lesson Note Drawer with react-hook-form + Zod + Laravel 422 Inline Errors */}
      <FormDrawer
        open={noteDrawerOpen}
        onClose={() => setNoteDrawerOpen(false)}
        title="Publish Weekly Lesson Note"
        description="Record lesson topic, week number, and learning objectives for your class."
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNoteDrawerOpen(false)}
              className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmitLessonNote)}
              disabled={createLessonNoteMutation.isPending}
              className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {createLessonNoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Lesson Note"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmitLessonNote)} className="space-y-4" noValidate>
          {noteSaved && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {noteSaved}
            </div>
          )}
          {noteError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" /> {noteError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Target Class *</label>
              <select {...register("class_id")} className={inputCls}>
                <option value="">Select class…</option>
                {classList.map(([id, info]) => (
                  <option key={id} value={info.id || id}>
                    {info.name}
                  </option>
                ))}
                {classList.length === 0 && <option value="1">Default Class</option>}
              </select>
              {errors.class_id && <p className="text-xs text-red-600 mt-1">{errors.class_id.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Academic Week *</label>
              <input {...register("week_number")} placeholder="e.g. Week 4" className={inputCls} />
              {errors.week_number && <p className="text-xs text-red-600 mt-1">{errors.week_number.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Subject *</label>
            <input {...register("subject_name")} placeholder="e.g. Mathematics" className={inputCls} />
            {errors.subject_name && <p className="text-xs text-red-600 mt-1">{errors.subject_name.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Lesson Topic *</label>
            <input {...register("topic")} placeholder="e.g. Quadratic Equations & Factorization" className={inputCls} />
            {errors.topic && <p className="text-xs text-red-600 mt-1">{errors.topic.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Learning Objectives &amp; Summary *</label>
            <textarea
              {...register("objectives")}
              rows={4}
              placeholder="Outline key concepts, examples, and reading references…"
              className="w-full p-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
            />
            {errors.objectives && <p className="text-xs text-red-600 mt-1">{errors.objectives.message}</p>}
          </div>
        </form>
      </FormDrawer>
    </div>
  );
}
