using EduCrm.Application.DTOs.Exam.Request;
using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Authorize(Roles = "Admin,Mentor")]
[Route("api/exams")]
public class ExamsController(IExamService examService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await examService.GetAllAsync();

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("group/{groupId:int}")]
    public async Task<IActionResult> GetByGroup(int groupId)
    {
        var result = await examService.GetByGroupAsync(groupId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await examService.GetByIdAsync(id);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExamRequest request)
    {
        // ModelState.IsValid можно опустить, если на контроллере стоит [ApiController], 
        // так как ASP.NET Core делает эту проверку автоматически. Но для надежности оставим.
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await examService.CreateAsync(request);

        if (!result.IsSuccess)
            return HandleError(result);

        // Возвращаем CreatedAtAction, передавая весь result, как требует твоя новая логика
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateExamRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await examService.UpdateAsync(id, request);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> SetStatus(int id, [FromBody] SetExamStatusRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await examService.SetStatusAsync(id, request);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}