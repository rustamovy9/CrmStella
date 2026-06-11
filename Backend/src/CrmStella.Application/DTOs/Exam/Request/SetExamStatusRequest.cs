using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.Exam.Request;

public class SetExamStatusRequest
{
    [Required(ErrorMessage = "IsActive is required")]
    public bool IsActive { get; set; }
}