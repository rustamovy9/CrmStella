using CrmStella.Application.DTOs.Group.Response;

namespace CrmStella.Application.DTOs.Student.Response;

public class StudentDashboardResponse
{
    public decimal AverageScore { get; set; }
    public double AttendancePercent { get; set; }

    public int ActiveGroups { get; set; }
    public int CompletedGroups { get; set; }

    public int Absences { get; set; }
    public int LateMinutes { get; set; }

    public int TotalGroups { get; set; }

    public List<StudentDashboardScoreResponse> RecentScores { get; set; } = [];
    public List<GroupListItemResponse> Groups { get; set; } = [];
}


public class StudentDashboardScoreResponse
{
    public string LessonName { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public string? Comment { get; set; }
    public DateTime Date { get; set; }
}