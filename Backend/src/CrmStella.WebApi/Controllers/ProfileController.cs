using System.Security.Claims;
using CrmStella.Application.DTOs.Profile.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Route("api/profiles")]
[Authorize]
public class ProfileController(
    IProfileService profileService) : BaseController
{
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentProfile()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await profileService.GetByUserIdAsync(userId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{userId:int}")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        var result = await profileService.GetByUserIdAsync(userId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProfileRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await profileService.CreateAsync(userId, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return CreatedAtAction(nameof(GetCurrentProfile), result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await profileService.UpdateAsync(userId, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
    

    [HttpPatch("avatar")]
    public async Task<IActionResult> SetAvatar(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Avatar file is required" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var result = await profileService.SetAvatarAsync(userId, file, userId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpDelete]
    public async Task<IActionResult> Delete()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await profileService.DeleteAsync(userId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}