import agent from './agent';
import type { ApiResult } from '../types/auth';
import type { StudentDashboardResponse } from '../types/studentDashboard';
import type { MentorDashboardResponse } from '../types/mentor';

export const dashboardService = {
  getStudentDashboard: async () => {
    const response =
      await agent.get<ApiResult<StudentDashboardResponse>>(
        '/students/dashboard'
      );

    return response.data.data!;
  },

   getMentorDashboard: async () => {
    const response =
      await agent.get<ApiResult<MentorDashboardResponse>>(
        '/mentors/dashboard'
      );

    return response.data.data!;
  },
};


