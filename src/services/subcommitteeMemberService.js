// services/subcommitteeMemberService.js
import http from './http';

export class SubcommitteeMemberService {

  static async getSubcommitteeMembers(subcommitteeId) {
    try {
      const { data } = await http.get(
        `/api/country-committee-members/sub-committee/${subcommitteeId}`
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error?.status === 404) return [];
      console.error(`Error fetching members for subcommittee ${subcommitteeId}:`, error);
      return [];
    }
  }

  static async getSubcommitteeMemberCount(subcommitteeId) {
    try {
      const members = await this.getSubcommitteeMembers(subcommitteeId);
      return members.length;
    } catch (error) {
      console.error(`Error getting member count for subcommittee ${subcommitteeId}:`, error);
      return 0;
    }
  }

  static async getSubcommitteesMemberCounts(subcommittees) {
    try {
      return await Promise.all(
        subcommittees.map(async (subcommittee) => ({
          ...subcommittee,
          memberCount: await this.getSubcommitteeMemberCount(subcommittee.id),
        }))
      );
    } catch (error) {
      console.error('Error fetching subcommittee member counts:', error);
      return subcommittees.map((sub) => ({ ...sub, memberCount: 0 }));
    }
  }

  static async getAllSubcommitteesWithMembers() {
    try {
      const { data } = await http.get(
        '/api/country-committee-members/subcommittees/with-counts'
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching subcommittees with members:', error);
      // Fallback: get sub-committees list then count members for each
      try {
        const [subRes, membersRes] = await Promise.all([
          http.get('/api/sub-committees'),
          http.get('/api/country-committee-members/all'),
        ]);
        const subs = Array.isArray(subRes.data) ? subRes.data : [];
        return await this.getSubcommitteesMemberCounts(subs);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
  }
}

export default SubcommitteeMemberService;
