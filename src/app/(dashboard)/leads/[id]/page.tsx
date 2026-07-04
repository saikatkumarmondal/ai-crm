// src/app/(dashboard)/leads/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Loader } from "lucide-react";
import Link from "next/link";

interface Lead {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  status: string;
  source: string;
  notes?: string;
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await fetch(`/api/leads/${id}`);
        if (!res.ok) {
          router.push("/leads");
          return;
        }
        const data = await res.json();
        setLead(data.data);
        setFormData(data.data);
      } catch (error) {
        console.error("Failed to fetch lead", error);
        router.push("/leads");
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id, router]);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          companyName: formData.companyName,
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to save");
        return;
      }

      const data = await res.json();
      setLead(data.data);
      setFormData(data.data);
    } catch (error) {
      setError("An error occurred while saving");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      await fetch(`/api/leads/${id}`, { method: "DELETE" });
      router.push("/leads");
    } catch (error) {
      setError("Failed to delete lead");
      console.error(error);
    }
  };

  const statusOptions = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"];
  const sourceOptions = ["WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "EMAIL_CAMPAIGN", "COLD_CALL", "EVENT", "OTHER"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-slate-600">Loading lead...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return <div className="text-center py-8 text-slate-600">Lead not found</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/leads"
            className="text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{lead.fullName}</h1>
            <p className="text-slate-600 mt-1">{lead.companyName || "No company"}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 size={18} /> Delete
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Lead Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.companyName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={4}
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
            >
              {saving ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Status</h3>
            <select
              value={formData.status || "NEW"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Source</h3>
            <select
              value={formData.source || "OTHER"}
              onChange={(e) =>
                setFormData({ ...formData, source: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          {lead.assignedTo && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Assigned To</h3>
              <p className="text-slate-900 font-medium">{lead.assignedTo.fullName}</p>
              <p className="text-slate-600 text-sm">{lead.assignedTo.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
