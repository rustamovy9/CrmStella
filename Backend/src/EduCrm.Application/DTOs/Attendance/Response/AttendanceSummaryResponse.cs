namespace EduCrm.Application.DTOs.Attendance.Response;

public class AttendanceSummaryResponse
{
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Late { get; set; }
    public int Total { get; set; }
    public List<AbsentItem> RecentAbsent { get; set; } = new();
}

public class AbsentItem
{
    public string StudentFullName { get; set; } = "";
    public string LessonTitle { get; set; } = "";
    public string? Reason { get; set; }
    public DateTime MarkedAt { get; set; }
}