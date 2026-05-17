using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Mentor.Request;

public class UpdateMentorRequest
{
    [MaxLength(150, ErrorMessage = "Specialization must be at most 150 characters")]
    public string? Specialization { get; set; }

    [Range(0, 80, ErrorMessage = "Experience years must be between 0 and 80")]
    public int? ExperienceYears { get; set; }

    public DateTime? HireDate { get; set; }
}