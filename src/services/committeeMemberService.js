// services/committeeMemberService.js
import http from './http';

// This service is used by the Committees page modal.
// It MUST fetch real committee members from CountryCommitteeMemberController (/commissioner-generals)
export class CommitteeMemberService {
  static async getAllCommitteeMembers() {
    try {
      const { data } = await http.get('/api/commissioner-generals/get-all');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching committee members:', error);
      return [];
    }
  }

  static async getCommitteeMembers(committeeId) {
    try {
      const { data } = await http.get(`/api/commissioner-generals/committee/${committeeId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      // Treat 204 / not-found gracefully
      console.error(`Error fetching members for committee ${committeeId}:`, error);
      return [];
    }
  }

  static async getCommitteeMemberCount(committeeId) {
    const members = await this.getCommitteeMembers(committeeId);
    return members.length;
  }

  static async getAllCommitteesWithMembers() {
    try {
      const { data } = await http.get('/api/committees');
      const list = Array.isArray(data) ? data : [];
      return await Promise.all(
        list.map(async (c) => ({
          ...c,
          memberCount: (await this.getCommitteeMembers(c.id)).length,
        }))
      );
    } catch (error) {
      console.error('getAllCommitteesWithMembers error:', error);
      return [];
    }
  }
}

export default CommitteeMemberService;
