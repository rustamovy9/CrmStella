using EduCrm.Application.DTOs.Homework.Request;
using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace EduCrm.WebApi.Controllers;

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
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken = default)
    {
        var result = await _homeworkService.GetAllAsync(cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _homeworkService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("lesson/{lessonId:int}")]
    public async Task<IActionResult> GetByLessonId(int lessonId, CancellationToken cancellationToken = default)
    {
        var result = await _homeworkService.GetByLessonIdAsync(lessonId, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Create([FromBody] CreateHomeworkRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _homeworkService.CreateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPut]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Update([FromBody] HomeworkUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _homeworkService.UpdateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var result = await _homeworkService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}