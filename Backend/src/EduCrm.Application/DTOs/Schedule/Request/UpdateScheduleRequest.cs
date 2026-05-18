using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Schedule.Request;

public class UpdateScheduleRequest
{
    [Required] public DayOfWeek DayOfWeek { get; set; }

    [Required] public TimeSpan StartTime { get; set; }

    [Required] public TimeSpan EndTime { get; set; }

    public string? Room { get; set; }

    public DateTime? RecurringTo { get; set; }
}