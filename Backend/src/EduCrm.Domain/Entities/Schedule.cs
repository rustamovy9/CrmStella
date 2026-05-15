namespace EduCrm.Domain.Entities;

public class Schedule
{
    public int Id { get; set; }

    public int GroupId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? Room { get; set; }

    public DateTime RecurringFrom { get; set; }
    public DateTime? RecurringTo { get; set; }

    public Group Group { get; set; } = null!;
}