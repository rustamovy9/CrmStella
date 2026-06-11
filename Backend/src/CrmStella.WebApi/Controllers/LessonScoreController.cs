using System.Security.Claims;
using CrmStella.Application.DTOs.LessonScore.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Route("api/lesson-scores")]
[ApiController]
[Authorize]
public class LessonScoreController(ILessonScoreService lessonScoreService) : BaseController
{
    [HttpGet]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetAll()
    {
        var result = await lessonScoreService.GetAllAsync();

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await lessonScoreService.GetByIdAsync(id);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("lesson/{lessonId:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetByLesson(int lessonId)
    {
        var result = await lessonScoreService.GetByLessonIdAsync(lessonId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("student/{studentId:int}")]
    [Authorize(Roles = "Admin,Mentor,Student")]
    public async Task<IActionResult> GetByStudent(int studentId)
    {
        var result = await lessonScoreService.GetByStudentIdAsync(studentId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Create([FromBody] CreateLessonScoreRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var isAdmin = User.IsInRole("Admin");

        var result = await lessonScoreService.CreateAsync(request, userId, isAdmin);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPut]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Update([FromBody] UpdateLessonScoreRequest request)
    {
        var result = await lessonScoreService.UpdateAsync(request);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await lessonScoreService.DeleteAsync(id);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}