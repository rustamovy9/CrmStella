namespace EduCrm.Application.DTOs.Schedule.Response;

public class ScheduleResponse
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string GroupName { get; set; } = null!;
    public string DayOfWeek { get; set; } = null!;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? Room { get; set; }
    public DateTime RecurringFrom { get; set; }
    public DateTime? RecurringTo { get; set; }
}