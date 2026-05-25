using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Auth.Request;

public class AssignRoleRequest
{
    [Required(ErrorMessage = "User ID is required")]
    public int UserId { get; set; }

    [Required]
    [Range(1, 3, ErrorMessage = "Invalid role. Must be 1 (Admin), 2 (Mentor), or 3 (Student)")]
    public int RoleId { get; set; }
}