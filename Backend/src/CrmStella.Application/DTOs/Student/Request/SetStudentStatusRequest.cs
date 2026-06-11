using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.Students.Request;

public class SetStudentStatusRequest
{
    [Required(ErrorMessage = "IsActive is required")]
    public bool IsActive { get; set; }
}