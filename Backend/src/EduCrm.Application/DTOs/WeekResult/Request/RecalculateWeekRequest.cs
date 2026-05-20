using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.WeekResult.Request;

public class RecalculateWeekRequest
{
    [Required(ErrorMessage = "StudentId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid StudentId")]
    public int StudentId { get; set; }

    [Required(ErrorMessage = "GroupId is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid GroupId")]
    public int GroupId { get; set; }

    [Required(ErrorMessage = "WeekNumber is required")]
    [Range(1, 52, ErrorMessage = "WeekNumber must be between 1 and 52")]
    public int WeekNumber { get; set; }
}