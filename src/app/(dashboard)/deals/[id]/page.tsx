// src/app/(dashboard)/deals/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Loader } from "lucide-react";
import Link from "next/link";

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expectedCloseDate?: string;
  notes?: string;
  customer: {
    id: string;
    fullName: string;
    email?: string;
  };
  owner?: {
    id: string;
    fullName: string;
    email: string;
  };
}

const DEAL_STAGES = [
  "QUALIFICATION",
  "NEEDS_ANALYSIS",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Deal>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const res = await fetch(`/api/deals/${id}`);
        if (!res.ok) {
          router.push("/deals");
          return;
        }
        const data = await res.json();
        setDeal(data.data);
        setFormData(data.data);
      } catch (error) {
        console.error("Failed to fetch deal", error);
        router.push("/deals");
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [id, router]);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          value: formData.value,
          currency: formData.currency,
          probability: formData.probability,
          expectedCloseDate: formData.expectedCloseDate,
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to save");
        return;
      }

      const data = await res.json();
      setDeal(data.data);
      setFormData(data.data);
    } catch (error) {
      setError("An error occurred while saving");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/deals/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        setError("Failed to update stage");
        return;
      }

      const data = await res.json();
      setDeal(data.data);
      setFormData(data.data);
    } catch (error) {
      setError("An error occurred while updating stage");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this deal?")) return;

    try {
      await fetch(`/api/deals/${id}`, { method: "DELETE" });
      router.push("/deals");
    } catch (error) {
      setError("Failed to delete deal");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-slate-600">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return <div className="text-center py-8 text-slate-600">Deal not found</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/deals"
            className="text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{deal.title}</h1>
            <p className="text-slate-600 mt-1">
              {deal.customer.fullName} • {deal.currency} {deal.value.toLocaleString()}
            </p>
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
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Deal Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Deal Title
                </label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Deal Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        value: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency || "BDT"}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BDT">BDT</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Probability (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.probability || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      probability: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <p className="text-sm text-slate-600 mt-2">
                  {formData.probability || 0}%
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={
                    formData.expectedCloseDate
                      ? new Date(formData.expectedCloseDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedCloseDate: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
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
            <h3 className="font-semibold text-slate-900 mb-4">Deal Stage</h3>
            <select
              value={formData.stage || "QUALIFICATION"}
              onChange={(e) => handleStageChange(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              {DEAL_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Customer</h3>
            <p className="text-slate-900 font-medium">{deal.customer.fullName}</p>
            <p className="text-slate-600 text-sm">{deal.customer.email || "No email"}</p>
          </div>

          {deal.owner && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Owner</h3>
              <p className="text-slate-900 font-medium">{deal.owner.fullName}</p>
              <p className="text-slate-600 text-sm">{deal.owner.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
