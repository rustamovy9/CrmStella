using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.WeekResult.Request;

public class SetMentorCommentRequest
{
    [MaxLength(2000, ErrorMessage = "Comment must be at most 2000 characters")]
    public string? Comment { get; set; }
}