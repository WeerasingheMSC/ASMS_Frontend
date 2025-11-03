"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { 
  User, 
  Phone, 
  Wrench, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plus
} from "lucide-react";

interface Job {
  id: number;
  customerName: string;
  phone: string;
  serviceType: string;
  additionalServices: string;
  expectedCompletionDate: string;
  status: string;
}

export default function EmployeeDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const { showToast, ToastComponent } = useToast();

  const fetchJobs = () => {
    setLoading(true);
    fetch("/api/jobs/employee/1") // replace with actual employee ID
      .then((res) => res.json())
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching jobs:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const updateJob = async (id: number, updated: Partial<Job>) => {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update job");
      }
      
      showToast("Job updated successfully! ✅", "success");
      fetchJobs(); // Refresh the jobs list
    } catch (error) {
      console.error("Error updating job:", error);
      showToast("Failed to update job. Please try again.", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Failed":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "In Progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "Failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const filteredJobs = filter === "All" 
    ? jobs 
    : jobs.filter(job => job.status === filter);

  const statusCounts = {
    All: jobs.length,
    Pending: jobs.filter(j => j.status === "Pending").length,
    "In Progress": jobs.filter(j => j.status === "In Progress").length,
    Completed: jobs.filter(j => j.status === "Completed").length,
    Failed: jobs.filter(j => j.status === "Failed").length,
  };

  return (
    <>
      {ToastComponent}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Wrench className="w-8 h-8 text-blue-600" />
                Employee Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage and track your assigned jobs
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                filter === status
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400"
              }`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm opacity-90">{status}</div>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
              No jobs found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {filter === "All" ? "No jobs available" : `No ${filter} jobs`}
            </p>
          </div>
        ) : (
          /* Jobs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Card 
                key={job.id} 
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 overflow-hidden group"
              >
                <CardHeader className={`${getStatusColor(job.status)} border-b-2 transition-colors`}>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="text-lg">{job.serviceType}</span>
                    </span>
                    <span className="text-sm font-normal px-3 py-1 bg-white/50 rounded-full">
                      #{job.id}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  {/* Customer Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">{job.customerName}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <a 
                        href={`tel:${job.phone}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {job.phone}
                      </a>
                    </div>

                    <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                      <Plus className="w-4 h-4 text-slate-500 mt-0.5" />
                      <span className="text-sm">{job.additionalServices || "No additional services"}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">
                        {new Date(job.expectedCompletionDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="pt-4 border-t space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                      Update Status
                    </label>
                    <select
                      value={job.status}
                      onChange={(e) =>
                        updateJob(job.id, { status: e.target.value })
                      }
                      className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="Pending">⏳ Pending</option>
                      <option value="In Progress">🔧 In Progress</option>
                      <option value="Completed">✅ Completed</option>
                      <option value="Failed">❌ Failed</option>
                    </select>

                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
                      onClick={() =>
                        updateJob(job.id, {
                          expectedCompletionDate: new Date().toISOString(),
                        })
                      }
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Update Completion Date
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
