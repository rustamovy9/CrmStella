using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Exam.Request;
using EduCrm.Application.DTOs.Exam.Response;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.API.Controllers
{
    [Authorize(Roles = "Admin,Mentor")]
    public class ExamsController : BaseController
    {
        private readonly IExamService _examService;

        public ExamsController(IExamService examService)
        {
            _examService = examService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _examService.GetAllAsync();
            return HandleResult(result);
        }

        [HttpGet("group/{groupId:int}")]
        public async Task<IActionResult> GetByGroup(int groupId)
        {
            var result = await _examService.GetByGroupAsync(groupId);
            return HandleResult(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _examService.GetByIdAsync(id);
            return HandleResult(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateExamRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _examService.CreateAsync(request);
            if (result.IsSuccess && result.Data != null)
                return CreatedAtAction(nameof(GetById), new { id = result.Data.Id }, result.Data);
            
            return HandleResult(result);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateExamRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _examService.UpdateAsync(id, request);
            return HandleResult(result);
        }

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> SetStatus(int id, [FromBody] SetExamStatusRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _examService.SetStatusAsync(id, request);
            return HandleResult(result);
        }
    }
}

namespace EduCrm.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseController : ControllerBase
    {
        protected IActionResult HandleResult<T>(Result<T> result)
        {
            if (result.IsSuccess)
                return Ok(result.Data);

            return result.ErrorType switch
            {
                ErrorType.NotFound => NotFound(new { error = result.Error }),
                ErrorType.BadRequest => BadRequest(new { error = result.Error }),
                ErrorType.Unauthorized => Unauthorized(new { error = result.Error }),
                ErrorType.Forbidden => Forbid(),
                _ => StatusCode(500, new { error = result.Error })
            };
        }
    }
}