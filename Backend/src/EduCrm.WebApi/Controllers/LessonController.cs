using EduCrm.Application.DTOs.Lesson.Request;
using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Route("api/lessons")]

public class LessonController : BaseController
{
    private readonly ILessonService _lessonService;

    public LessonController(ILessonService lessonService)
    {
        _lessonService = lessonService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken = default)
    {
        var result = await _lessonService.GetAllAsync(cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _lessonService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("group/{groupId:int}")]
    public async Task<IActionResult> GetByGroupId(int groupId, CancellationToken cancellationToken = default)
    {
        var result = await _lessonService.GetByGroupIdAsync(groupId, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLessonRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _lessonService.CreateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateLessonRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _lessonService.UpdateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var result = await _lessonService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}