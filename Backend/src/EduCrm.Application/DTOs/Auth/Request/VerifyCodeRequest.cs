using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Auth.Request;

public class VerifyCodeRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(200, ErrorMessage = "Email must not exceed 200 characters")]
    public string Email { get; set; } = null!;

    public string Code { get; set; } = null!;
}