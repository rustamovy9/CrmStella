using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Students.Request;

public class SetStudentStatusRequest
{
    [Required(ErrorMessage = "IsActive is required")]
    public bool IsActive { get; set; }
}