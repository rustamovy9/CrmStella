using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Course.Request;

public class SetCourseStatusRequest
{
    [Required(ErrorMessage = "IsActive is required")]
    public bool IsActive { get; set; }
}