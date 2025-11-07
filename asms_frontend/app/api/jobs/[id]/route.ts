import { NextResponse } from "next/server";

// Mock data storage - replace with actual database
let jobs = [
  {
    id: 1,
    customerName: "John Doe",
    phone: "555-0101",
    serviceType: "Oil Change",
    additionalServices: "Tire Rotation",
    expectedCompletionDate: "2025-11-05",
    status: "Pending",
  },
  {
    id: 2,
    customerName: "Jane Smith",
    phone: "555-0102",
    serviceType: "Brake Repair",
    additionalServices: "None",
    expectedCompletionDate: "2025-11-06",
    status: "In Progress",
  },
  {
    id: 3,
    customerName: "Bob Johnson",
    phone: "555-0103",
    serviceType: "Engine Diagnostic",
    additionalServices: "Air Filter Replacement",
    expectedCompletionDate: "2025-11-07",
    status: "Pending",
  },
];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    const updates = await request.json();

    // Find and update the job
    const jobIndex = jobs.findIndex((job) => job.id === jobId);
    
    if (jobIndex === -1) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    jobs[jobIndex] = { ...jobs[jobIndex], ...updates };

    return NextResponse.json(jobs[jobIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    const job = jobs.find((job) => job.id === jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}
