using CrmStella.Application.DTOs.Homework.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Route("api/homeworks")]
[Authorize(Roles = "Admin,Mentor")]
public class HomeworkController : BaseController
{
    private readonly IHomeworkService _homeworkService;

    public HomeworkController(IHomeworkService homeworkService)
    {
        _homeworkService = homeworkService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var result = await _homeworkService.GetAllAsync();

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _homeworkService.GetByIdAsync(id);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("lesson/{lessonId:int}")]
    public async Task<IActionResult> GetByLessonId(int lessonId)
    {
        var result = await _homeworkService.GetByLessonAsync(lessonId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Create(
        [FromBody] CreateHomeworkRequest request)
    {
        var result = await _homeworkService.CreateAsync(request);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateHomeworkRequest request)
    {
        var result = await _homeworkService.UpdateAsync(id, request);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> SetStatus(
        int id,
        [FromBody] SetHomeworkStatusRequest request)
    {
        var result = await _homeworkService.SetStatusAsync(id, request);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}