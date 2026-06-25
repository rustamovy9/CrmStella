using System.Security.Claims;
using CrmStella.Application.DTOs.Mentor.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Route("api/mentors")]
[Authorize(Roles = "Admin,Mentor")]
public class MentorsController(IMentorService mentorService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] MentorQueryRequest query,
        CancellationToken cancellationToken)
    {
        var result = await mentorService.GetAllAsync(query, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await mentorService.GetByIdAsync(id);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMentorRequest request)
    {
        var result = await mentorService.UpdateAsync(id, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> SetStatus(int id, [FromBody] SetMentorStatusRequest request)
    {
        var result = await mentorService.SetStatusAsync(id, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var result = await mentorService.GetDashboardAsync(userId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}