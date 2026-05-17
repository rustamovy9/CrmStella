using System.Security.Claims;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Route("api/files")]
[Authorize(Roles = "Admin")]
public class FilesController(IFileStorageService fileStorageService) : BaseController
{
    [HttpPost("upload")]
    public async Task<IActionResult> Upload(
        IFormFile file,
        [FromQuery] FileOwnerType ownerType,
        [FromQuery] int ownerId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await fileStorageService.UploadAsync(file, ownerType, ownerId, userId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}