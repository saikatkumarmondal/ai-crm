// src/app/(dashboard)/leads/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, ChevronRight, Trash2 } from "lucide-react";

interface Lead {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  status: string;
  source: string;
  createdAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    source: "OTHER",
  });

  const fetchLeads = async (q?: string, status?: string) => {
    try {
      const params = new URLSearchParams();
      if (q) params.append("search", q);
      if (status) params.append("status", status);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.data?.items || []);
    } catch (error) {
      console.error("Failed to fetch leads", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(search, statusFilter);
  }, [search, statusFilter]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          companyName: "",
          source: "OTHER",
        });
        fetchLeads(search, statusFilter);
      }
    } catch (error) {
      console.error("Failed to create lead", error);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm("Are you sure?")) {
      try {
        await fetch(`/api/leads/${id}`, { method: "DELETE" });
        fetchLeads(search, statusFilter);
      } catch (error) {
        console.error("Failed to delete lead", error);
      }
    }
  };

  const statusColors = {
    NEW: "bg-blue-100 text-blue-800",
    CONTACTED: "bg-purple-100 text-purple-800",
    QUALIFIED: "bg-green-100 text-green-800",
    UNQUALIFIED: "bg-red-100 text-red-800",
    CONVERTED: "bg-emerald-100 text-emerald-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-600 mt-1">Manage and track all your leads</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> New Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="UNQUALIFIED">Unqualified</option>
            <option value="CONVERTED">Converted</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-600">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            No leads found. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {lead.fullName}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{lead.email || "-"}</td>
                    <td className="px-6 py-3 text-slate-600">
                      {lead.companyName || "-"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          statusColors[lead.status as keyof typeof statusColors]
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600 text-sm">
                      {lead.source}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ChevronRight size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={18} />
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

      {/* Create Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Lead</h2>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WEBSITE">Website</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="SOCIAL_MEDIA">Social Media</option>
                  <option value="EMAIL_CAMPAIGN">Email Campaign</option>
                  <option value="COLD_CALL">Cold Call</option>
                  <option value="EVENT">Event</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Lead
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-200 text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
