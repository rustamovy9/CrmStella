using CrmStella.Application.DTOs.Group.Response;

namespace CrmStella.Application.DTOs.Mentor.Response;

public class MentorDashboardResponse
{
    public int ActiveGroups { get; set; }
    public int TotalStudents { get; set; }
    public int LessonsToday { get; set; }

    public List<GroupListItemResponse> Groups { get; set; } =[];
}