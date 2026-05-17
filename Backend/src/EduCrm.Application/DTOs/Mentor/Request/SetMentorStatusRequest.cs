using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Mentor.Request;

public class SetMentorStatusRequest
{
    [Required(ErrorMessage = "IsActive is required")]
    public bool IsActive { get; set; }
}