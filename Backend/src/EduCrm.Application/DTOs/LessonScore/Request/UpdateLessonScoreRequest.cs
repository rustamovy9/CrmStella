using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.LessonScore.Request;

public class UpdateLessonScoreRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Id must be a positive integer")]
    public int Id { get; set; }

    [Range(0, 100, ErrorMessage = "Score must be between 0 and 100")]
    public decimal? Score { get; set; }

    [MaxLength(1000, ErrorMessage = "MentorFeedback cannot exceed 1000 characters")]
    public string? MentorFeedback { get; set; }
}