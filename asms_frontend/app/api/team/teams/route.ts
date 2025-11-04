import { NextResponse } from "next/server"

// Mock data - replace with actual database calls
const mockTeams = [
  {
    id: "1",
    name: "Engine Team",
    specialization: "Engine Repair",
    memberCount: 5,
  },
  {
    id: "2",
    name: "Electrical Team",
    specialization: "Electrical Systems",
    memberCount: 3,
  },
  {
    id: "3",
    name: "Bodywork Team",
    specialization: "Bodywork & Paint",
    memberCount: 4,
  },
]

export async function GET() {
  try {
    // TODO: Replace with actual database query to Spring Boot backend
    // const response = await fetch(`${process.env.BACKEND_API_URL}/api/teams`);
    // const teams = await response.json();

    return NextResponse.json(mockTeams)
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}
