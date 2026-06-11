using System.Security.Claims;
using CrmStella.Application.DTOs.Course.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Route("api/courses")]
[Authorize(Roles = "Admin")]
public class CourseController(ICourseService courseService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] CourseQueryRequest query)
    {
        var result = await courseService.GetAllAsync(query);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await courseService.GetByIdAsync(id);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateCourseRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await courseService.CreateAsync(request, userId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCourseRequest request)
    {
        var result = await courseService.UpdateAsync(id, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> SetStatus(int id, [FromBody] SetCourseStatusRequest request)
    {
        var result = await courseService.SetStatusAsync(id, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPatch("{id:int}/icon")]
    public async Task<IActionResult> SetCourseIcon(int id, IFormFile file)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await courseService.SetCourseIconAsync(id, file, userId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}