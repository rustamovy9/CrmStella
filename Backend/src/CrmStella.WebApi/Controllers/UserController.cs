using System.Security.Claims;
using CrmStella.Application.DTOs.Users.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Authorize]
[Route("api/users")]
public class UserController(IUserService userService) : BaseController
{
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await userService.GetAllAsync();
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("role/{roleId}")]
    public async Task<IActionResult> GetByRole(int roleId)
    {
        var result = await userService.GetByRoleAsync(roleId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var currentRole = User.FindFirstValue(ClaimTypes.Role);

        // Admin видит всех, остальные только себя
        if (currentRole != "Admin" && currentUserId != id)
            return Forbid();

        var result = await userService.GetByIdAsync(id);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var result = await userService.UpdateAsync(id, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id}/set-active")]
    public async Task<IActionResult> SetActive(int id, [FromQuery] bool isActive)
    {
        var result = await userService.SetActiveAsync(id, isActive);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await userService.DeleteAsync(id);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}