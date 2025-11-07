import { NextResponse } from "next/server";

// Mock data - replace with actual database calls
const mockJobs = [
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeId } = await params;
    
    // TODO: Replace with actual database query filtering by employee ID
    // For now, returning all mock jobs
    
    return NextResponse.json(mockJobs);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
