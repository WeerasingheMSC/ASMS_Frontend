// Shared team & member data used by Team Analysis and Projects table
export type Team = { id: string; name: string; color?: string };
export type Member = { id: string; name: string; team: string; teamColor?: string; avatar?: string; productivity?: number };

export const teams: Team[] = [
  { id: 'all', name: 'All Teams', color: 'bg-gray-500' },
  { id: 'engine', name: 'Engine Team', color: 'bg-blue-500' },
  { id: 'transmission', name: 'Transmission Team', color: 'bg-green-500' },
  { id: 'electrical', name: 'Electrical Team', color: 'bg-yellow-500' },
  { id: 'brakes', name: 'Brakes Team', color: 'bg-red-500' },
];

export const members: Member[] = [
  { id: 'm1', name: 'John Anderson', team: 'Engine Team', teamColor: 'bg-blue-500', avatar: 'JA', productivity: 95 },
  { id: 'm2', name: 'Sarah Mitchell', team: 'Transmission Team', teamColor: 'bg-green-500', avatar: 'SM', productivity: 98 },
  { id: 'm3', name: 'Mike Johnson', team: 'Electrical Team', teamColor: 'bg-yellow-500', avatar: 'MJ', productivity: 88 },
  { id: 'm4', name: 'Emily Davis', team: 'Brakes Team', teamColor: 'bg-red-500', avatar: 'ED', productivity: 96 },
  { id: 'm5', name: 'Robert Wilson', team: 'Engine Team', teamColor: 'bg-blue-500', avatar: 'RW', productivity: 91 },
];

export function getMembersByTeamName(teamName?: string) {
  if (!teamName || teamName === 'All Teams') return members;
  return members.filter((m) => m.team === teamName);
}

export function getTeamById(id: string) {
  return teams.find((t) => t.id === id) || null;
}

export function getTeamAverageProductivity(teamName?: string) {
  const list = teamName && teamName !== 'All Teams' ? members.filter((m) => m.team === teamName) : members;
  if (list.length === 0) return 0;
  const total = list.reduce((acc, m) => acc + (m.productivity || 0), 0);
  return Math.round(total / list.length);
}
