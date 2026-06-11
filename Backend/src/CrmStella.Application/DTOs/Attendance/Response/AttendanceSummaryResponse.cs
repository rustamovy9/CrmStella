namespace CrmStella.Application.DTOs.Attendance.Response;

public class AttendanceSummaryResponse
{
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Late { get; set; }
    public int Total { get; set; }
    public List<AbsentItem> RecentAbsent { get; set; } = new();
    public List<LateItem> RecentLate { get; set; } = new();
}

public class AbsentItem
{
    public string StudentFullName { get; set; } = "";
    public string LessonTitle { get; set; } = "";
    public string? Reason { get; set; }
    public DateTime MarkedAt { get; set; }
    
    public int GroupId { get; set; }
    public string GroupName { get; set; } = "";
    
    public int? MentorId { get; set; }
    public int? MentorUserId { get; set; }
    public string? MentorFullName { get; set; }
}

public class LateItem
{
    public string StudentFullName { get; set; } = "";
    public string LessonTitle { get; set; } = "";
    public int LateMinutes { get; set; }
    public DateTime MarkedAt { get; set; }
    
    public int GroupId { get; set; }
    public string GroupName { get; set; } = "";
    
    public int? MentorId { get; set; }
    public int? MentorUserId { get; set; }
    public string? MentorFullName { get; set; }
}