// services/simpleDashboardService.js
import http from './http';

class SimpleDashboardService {
  static async getSimplePerformanceData() {
    try {
      const { data } = await http.get('/api/dashboard/performance/simple');
      return data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  static async getCountries() {
    try {
      const { data } = await http.get('/api/countries');
      return data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  static async getReportsSummary() {
    try {
      const { data } = await http.get('/api/reports/summary');
      return data;
    } catch (error) {
      console.error('Error fetching reports summary:', error);
      throw error;
    }
  }

  static async getResolutionsSummary() {
    try {
      const { data } = await http.get('/api/resolutions/summary');
      return data;
    } catch (error) {
      console.error('Error fetching resolutions summary:', error);
      throw error;
    }
  }
}

export default SimpleDashboardService;
