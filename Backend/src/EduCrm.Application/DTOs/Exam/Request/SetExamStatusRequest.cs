using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Exam.Request;

public class SetExamStatusRequest
{
    [Required(ErrorMessage = "IsActive is required")]
    public bool IsActive { get; set; }
}