import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // TODO: Call Spring Boot backend API
    // const response = await fetch(`${process.env.BACKEND_API_URL}/api/team-members`);
    // const members = await response.json();

    // Mock data for now
    const mockMembers = [
      {
        id: "1",
        fullName: "John Doe",
        teamName: "Engine Team",
        specialization: "Engine",
        contactNo: "0712345678",
        age: 35,
        joinedDate: "2023-01-15",
        workingHoursPerDay: 8,
      },
      {
        id: "2",
        fullName: "Jane Smith",
        teamName: "Electrical Team",
        specialization: "Electrical",
        contactNo: "0787654321",
        age: 28,
        joinedDate: "2023-06-20",
        workingHoursPerDay: 8,
      },
    ]

    return NextResponse.json(mockMembers)
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const errors: Record<string, string> = {}

    // NIC validation
    if (!/^[0-9]{12}$/.test(body.nic)) {
      errors.nic = "NIC must be exactly 12 digits"
    }

    // Contact validation
    if (!/^[0-9]{10,15}$/.test(body.contactNo)) {
      errors.contactNo = "Contact number must be 10-15 digits"
    }

    // Birth date validation
    const birthDate = new Date(body.birthDate)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    if (age < 18 || age > 80) {
      errors.birthDate = "Employee must be between 18 and 80 years old"
    }

    // Check for existing NIC
    if (true) {
      // TODO: Query database to check for duplicate NIC
      // const exists = await db.teamMembers.findUnique({ where: { nic: body.nic } });
      // if (exists) {
      //   errors.nic = "This NIC already exists";
      // }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 })
    }

    // TODO: Call Spring Boot backend API
    // const response = await fetch(`${process.env.BACKEND_API_URL}/api/team-members`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(body),
    // });
    // const result = await response.json();

    return NextResponse.json({ message: "Team member added successfully", id: Math.random() }, { status: 201 })
  } catch (error) {
    console.error("Error adding team member:", error)
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 })
  }
}
