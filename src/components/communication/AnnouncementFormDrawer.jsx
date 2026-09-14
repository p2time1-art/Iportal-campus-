import React, { useState, useEffect } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FormDrawer from "@/components/admin/FormDrawer";

export default function AnnouncementFormDrawer({ open, onClose, onSave, announcement, classes, schoolId, userId, userName }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    body: "",
    category: "general",
    audience_type: "school",
    target_role: "",
    target_class_id: "",
    is_pinned: false,
    is_public: false,
    publish_now: true,
    publish_at: "",
    expires_at: "",
    attachment_url: "",
    attachment_name: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (announcement) {
      setForm({
        title: announcement.title || "",
        description: announcement.description || "",
        body: announcement.body || "",
        category: announcement.category || "general",
        audience_type: announcement.audience_type || "school",
        target_role: announcement.target_role || "",
        target_class_id: announcement.target_class_id || "",
        is_pinned: announcement.is_pinned || false,
        is_public: announcement.is_public || false,
        publish_now: !announcement.publish_at,
        publish_at: announcement.publish_at ? announcement.publish_at.slice(0, 16) : "",
        expires_at: announcement.expires_at ? announcement.expires_at.slice(0, 16) : "",
        attachment_url: announcement.attachment_url || "",
        attachment_name: announcement.attachment_name || "",
      });
    } else {
      setForm({
        title: "", description: "", body: "", category: "general",
        audience_type: "school", target_role: "", target_class_id: "",
        is_pinned: false, is_public: false, publish_now: true,
        publish_at: "", expires_at: "", attachment_url: "", attachment_name: "",
      });
    }
    setError("");
  }, [announcement, open]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update("attachment_url", file_url);
      update("attachment_name", file.name);
    } catch (err) {
      setError("Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.description.trim()) return "Short description is required";
    if (form.audience_type === "role" && !form.target_role) return "Target role is required for role-targeted announcements";
    if (form.audience_type === "class" && !form.target_class_id) return "Target class is required for class-targeted announcements";
    if (!form.publish_now && !form.publish_at) return "Scheduled publish time is required";
    if (form.expires_at) {
      const pubDate = form.publish_now ? new Date() : new Date(form.publish_at);
      const expDate = new Date(form.expires_at);
      if (expDate < pubDate) return "Expiry must not precede publication";
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError("");
    try {
      const targetClass = classes.find((c) => c.id === form.target_class_id);
      const publishAt = form.publish_now ? null : new Date(form.publish_at).toISOString();
      const expiresAt = form.expires_at ? new Date(form.expires_at).toISOString() : null;

      const payload = {
        school_id: schoolId,
        title: form.title.trim(),
        description: form.description.trim(),
        body: form.body.trim(),
        category: form.category,
        audience_type: form.audience_type,
        target_role: form.audience_type === "school" ? null : (form.target_role || null),
        target_class_id: form.audience_type === "class" ? form.target_class_id : null,
        target_class_name: form.audience_type === "class" ? targetClass?.name || "" : null,
        is_pinned: form.is_pinned,
        is_public: form.is_public,
        publish_at: publishAt,
        expires_at: expiresAt,
        attachment_url: form.attachment_url || null,
        attachment_name: form.attachment_name || null,
        author_id: userId,
        author_name: userName,
        date: new Date().toISOString().slice(0, 10),
        status: form.publish_now ? "published" : "scheduled",
      };

      await onSave(payload);
    } catch (err) {
      setError(err.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
  const labelClass = "block text-xs font-semibold text-foreground mb-1.5";

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={announcement ? "Edit Announcement" : "Create Announcement"}
      description={announcement ? "Update announcement details" : "Publish a new announcement to your school"}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {announcement ? "Update" : "Publish"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputClass}
            placeholder="Announcement title"
          />
        </div>

        <div>
          <label className={labelClass}>Short Description *</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={inputClass}
            placeholder="Brief summary shown in feeds and notifications"
          />
        </div>

        <div>
          <label className={labelClass}>Full Content</label>
          <textarea
            value={form.body}
            onChange={(e) => update("body", e.target.value)}
            rows={5}
            className="w-full px-3 py-2.5 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30 resize-y"
            placeholder="Write the full announcement content..."
          />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select value={form.category} onChange={(e) => update("category", e.target.value)} className={inputClass}>
            <option value="general">General</option>
            <option value="resumption">Resumption</option>
            <option value="examination">Examination</option>
            <option value="pta">PTA</option>
            <option value="sports">Sports</option>
            <option value="events">Events</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Audience *</label>
          <select value={form.audience_type} onChange={(e) => update("audience_type", e.target.value)} className={inputClass}>
            <option value="school">School-wide (All members)</option>
            <option value="role">Role-targeted (Teachers/Students/Parents)</option>
            <option value="class">Class-targeted</option>
          </select>
        </div>

        {form.audience_type === "role" && (
          <div>
            <label className={labelClass}>Target Role *</label>
            <select value={form.target_role} onChange={(e) => update("target_role", e.target.value)} className={inputClass}>
              <option value="">Select role…</option>
              <option value="teacher">Teachers</option>
              <option value="student">Students</option>
              <option value="parent">Parents</option>
            </select>
          </div>
        )}

        {form.audience_type === "class" && (
          <>
            <div>
              <label className={labelClass}>Target Class *</label>
              <select value={form.target_class_id} onChange={(e) => update("target_class_id", e.target.value)} className={inputClass}>
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Target Role (optional)</label>
              <select value={form.target_role} onChange={(e) => update("target_role", e.target.value)} className={inputClass}>
                <option value="">All associated with class</option>
                <option value="student">Students only</option>
                <option value="parent">Parents only</option>
                <option value="teacher">Teachers only</option>
              </select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.publish_now}
              onChange={(e) => update("publish_now", e.target.checked)}
              className="w-4 h-4 rounded border-border text-[hsl(var(--brand-indigo))] focus:ring-[hsl(var(--brand-indigo))]/30"
            />
            <span className="text-sm font-medium text-foreground">Publish immediately</span>
          </label>
          {!form.publish_now && (
            <div>
              <label className={labelClass}>Scheduled Publish Time *</label>
              <input
                type="datetime-local"
                value={form.publish_at}
                onChange={(e) => update("publish_at", e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Expiry Date (optional)</label>
          <input
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => update("expires_at", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_pinned}
              onChange={(e) => update("is_pinned", e.target.checked)}
              className="w-4 h-4 rounded border-border text-[hsl(var(--brand-indigo))] focus:ring-[hsl(var(--brand-indigo))]/30"
            />
            <span className="text-sm font-medium text-foreground">Pin announcement</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => update("is_public", e.target.checked)}
              className="w-4 h-4 rounded border-border text-[hsl(var(--brand-indigo))] focus:ring-[hsl(var(--brand-indigo))]/30"
            />
            <span className="text-sm font-medium text-foreground">Show on public homepage</span>
          </label>
        </div>

        <div>
          <label className={labelClass}>Attachment (optional)</label>
          {form.attachment_url ? (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary/50 border border-border">
              <span className="text-sm text-foreground truncate flex-1">{form.attachment_name || "Attachment"}</span>
              <button
                onClick={() => { update("attachment_url", ""); update("attachment_name", ""); }}
                className="p-1 rounded hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 border-dashed border-border hover:border-[hsl(var(--brand-indigo))]/40 hover:bg-[hsl(var(--brand-indigo))]/5 transition-colors cursor-pointer">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
              <span className="text-sm text-muted-foreground">{uploading ? "Uploading…" : "Click to upload"}</span>
              <input type="file" onChange={handleUpload} className="hidden" />
            </label>
          )}
        </div>
      </div>
    </FormDrawer>
  );
}