// Shared team & member data used by Team Analysis and Projects table
export type Team = { id: string; name: string; color?: string };
export type Member = { id: string; name: string; team: string; teamColor?: string; avatar?: string; productivity?: number };

// Manual team/member data removed. Frontend should prefer backend endpoints when available.
// We keep empty fallbacks and compatible function signatures so components don't crash.
export const teams: Team[] = [];
export const members: Member[] = [];

export function getMembersByTeamName(teamName?: string) {
  // Return empty array when no manual data present. Components may fetch backend members instead.
  return [] as Member[];
}

export function getTeamById(id: string) {
  return null as Team | null;
}

export function getTeamAverageProductivity(teamName?: string) {
  return 0;
}
