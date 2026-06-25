import type { GroupListItemResponse } from './group';

export interface MentorDashboardResponse {
  activeGroups: number;
  totalStudents: number;
  lessonsToday: number;
  groups: GroupListItemResponse[];
}