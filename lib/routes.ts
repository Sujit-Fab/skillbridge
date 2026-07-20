export function getCandidateProfilePath(candidateId: string) {
  return `/candidate/${encodeURIComponent(candidateId)}`;
}
