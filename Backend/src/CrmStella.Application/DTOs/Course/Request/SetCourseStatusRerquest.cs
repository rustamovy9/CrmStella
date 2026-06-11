using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.DTOs.Course.Request;

public class SetCourseStatusRequest
{
    [Required(ErrorMessage = "IsActive is required")]
    public bool IsActive { get; set; }
}