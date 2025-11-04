import Link from "next/link";
import styles from "../employee.module.css";
import projStyles from "./projects.module.css";
import ProjectsContainer from "./ProjectsContainer";

const sampleProjects = [
  { name: "Client Website Redesign", client: "Innovate Inc.", status: "In Progress", progress: 75, due: "2024-12-15" },
  { name: "Mobile App Development", client: "Synergy Corp.", status: "Completed", progress: 100, due: "2024-10-30" },
  { name: "API Integration", client: "Tech Solutions", status: "Pending", progress: 10, due: "2025-01-20" },
];

function statusColor(status: string) {
  switch (status) {
    case "Completed":
      return "bg-green-500";
    case "In Progress":
      return "bg-yellow-400";
    case "Pending":
      return "bg-gray-300";
    default:
      return "bg-gray-300";
  }
}

export default function EmployeeProjectsPage() {
  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "Completed":
        return `${projStyles.badge} ${projStyles.statusCompleted}`;
      case "In Progress":
        return `${projStyles.badge} ${projStyles.statusInProgress}`;
      case "Pending":
        return `${projStyles.badge} ${projStyles.statusPending}`;
      case "Overdue":
        return `${projStyles.badge} ${projStyles.statusOverdue}`;
      default:
        return projStyles.badge;
    }
  };

  const progressFillClass = (progress: number, status: string) => {
    if (status === "Completed") return `${projStyles.progressFill} green`;
    if (status === "In Progress") return `${projStyles.progressFill} orange`;
    if (status === "Overdue") return `${projStyles.progressFill} red`;
    return `${projStyles.progressFill} gray`;
  };

  return <ProjectsContainer projects={sampleProjects} />;
}
