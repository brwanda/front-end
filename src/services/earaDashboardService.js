// services/earaDashboardService.js
import http from './http';

export class EARADashboardService {
  static async getPerformanceMetrics(country = 'all', committee = 'all', timeFilter = 'month') {
    try {
      const { data } = await http.get('/api/dashboard/eara/performance-metrics', {
        params: { country, committee, time: timeFilter },
      });
      return data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  static async getCountryPerformance(country = 'all', committee = 'all', timeFilter = 'month') {
    try {
      const { data } = await http.get('/api/dashboard/eara/country-performance', {
        params: { country, committee, time: timeFilter },
      });
      return data;
    } catch (error) {
      console.error('Error fetching country performance:', error);
      throw error;
    }
  }

  static async getResolutionStatus(country = 'all', committee = 'all', timeFilter = 'month') {
    try {
      const { data } = await http.get('/api/dashboard/eara/resolution-status', {
        params: { country, committee, time: timeFilter },
      });
      return data;
    } catch (error) {
      console.error('Error fetching resolution status:', error);
      throw error;
    }
  }

  static async getMonthlyTrends(country = 'all', committee = 'all', timeFilter = 'month') {
    try {
      const { data } = await http.get('/api/dashboard/eara/monthly-trends', {
        params: { country, committee, time: timeFilter },
      });
      return data;
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      throw error;
    }
  }

  static async getTaskAssignments(country = 'all', committee = 'all', timeFilter = 'month') {
    try {
      const { data } = await http.get('/api/dashboard/eara/task-assignments', {
        params: { country, committee, time: timeFilter },
      });
      return data;
    } catch (error) {
      console.error('Error fetching task assignments:', error);
      throw error;
    }
  }

  static async getGanttData(country = 'all', committee = 'all', timeFilter = 'month') {
    try {
      const { data } = await http.get('/api/dashboard/eara/gantt-data', {
        params: { country, committee, time: timeFilter },
      });
      return data;
    } catch (error) {
      console.error('Error fetching Gantt data:', error);
      throw error;
    }
  }

  static async getComprehensiveDashboardData(country = 'all', committee = 'all', timeFilter = 'month') {
    try {
      const [
        performanceMetrics,
        countryPerformance,
        resolutionStatus,
        monthlyTrends,
        taskAssignments,
        ganttData,
      ] = await Promise.all([
        this.getPerformanceMetrics(country, committee, timeFilter),
        this.getCountryPerformance(country, committee, timeFilter),
        this.getResolutionStatus(country, committee, timeFilter),
        this.getMonthlyTrends(country, committee, timeFilter),
        this.getTaskAssignments(country, committee, timeFilter),
        this.getGanttData(country, committee, timeFilter),
      ]);
      return { performanceMetrics, countryPerformance, resolutionStatus, monthlyTrends, taskAssignments, ganttData };
    } catch (error) {
      console.error('Error fetching comprehensive dashboard data:', error);
      throw error;
    }
  }

  static async getAvailableCountries() {
    try {
      const { data } = await http.get('/api/dashboard/countries');
      return data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  static async getAvailableCommittees() {
    try {
      const { data } = await http.get('/api/dashboard/committees');
      return data;
    } catch (error) {
      console.error('Error fetching committees:', error);
      throw error;
    }
  }

  static async exportDashboardData(format = 'csv', country = 'all', committee = 'all', timeFilter = 'month') {
    try {
      const { data } = await http.post(
        `/api/dashboard/export?format=${format}&country=${country}&committee=${committee}&time=${timeFilter}`,
        null,
        { expectBlob: format === 'csv' }
      );
      if (format === 'csv') {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eara-dashboard-${country}-${committee}-${timeFilter}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        return data;
      }
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      throw error;
    }
  }

  // ── Pure utility methods (no fetch) ──────────────────────────────────────

  static generateRecommendations(metrics) {
    const recommendations = [];
    if (metrics.approvalRate < 80)
      recommendations.push({ type: 'warning', title: 'Low Approval Rate', description: 'Consider reviewing approval processes and providing additional training to committee members.', priority: 'high' });
    if (metrics.taskCompletion < 70)
      recommendations.push({ type: 'warning', title: 'Low Task Completion', description: 'Review task assignment processes and consider redistributing workload.', priority: 'medium' });
    if (metrics.averageResolutionTime > 20)
      recommendations.push({ type: 'info', title: 'High Resolution Time', description: 'Implement streamlined processes to reduce resolution time.', priority: 'medium' });
    if (metrics.memberParticipation < 85)
      recommendations.push({ type: 'warning', title: 'Low Member Participation', description: 'Encourage member engagement through incentives and better communication.', priority: 'low' });
    return recommendations;
  }
}

export default EARADashboardService;
