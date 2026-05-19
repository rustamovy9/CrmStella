using EduCrm.Application.DTOs.Homework.Request;
using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Route("api/homeworks")]
[Authorize(Roles = "Admin,Mentor")]
public class HomeworkController(IHomeworkService homeworkService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await homeworkService.GetAllAsync();
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("lesson/{lessonId:int}")]
    public async Task<IActionResult> GetByLesson(int lessonId)
    {
        var result = await homeworkService.GetByLessonAsync(lessonId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await homeworkService.GetByIdAsync(id);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHomeworkRequest request)
    {
        var result = await homeworkService.CreateAsync(request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateHomeworkRequest request)
    {
        var result = await homeworkService.UpdateAsync(id, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> SetStatus(int id, [FromBody] SetHomeworkStatusRequest request)
    {
        var result = await homeworkService.SetStatusAsync(id, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}