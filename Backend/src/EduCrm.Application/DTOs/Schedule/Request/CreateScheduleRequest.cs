using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Schedule.Request;

public class CreateScheduleRequest
{
    [Required] public int GroupId { get; set; }

    [Required] public DayOfWeek DayOfWeek { get; set; }

    [Required] public TimeSpan StartTime { get; set; }

    [Required] public TimeSpan EndTime { get; set; }

    public string? Room { get; set; }

    [Required] public DateTime RecurringFrom { get; set; }

    public DateTime? RecurringTo { get; set; }
}