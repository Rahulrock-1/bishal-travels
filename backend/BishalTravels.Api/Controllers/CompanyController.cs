using Microsoft.AspNetCore.Mvc;
using BishalTravels.Api.Common;
using BishalTravels.Api.DTOs;
using BishalTravels.Api.Features;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompanyController : ControllerBase
{
    private readonly IMediator _mediator;

    public CompanyController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<CompanyProfileDto>> GetCompanyProfile()
    {
        var profile = await _mediator.Send(new GetCompanyProfileQuery());
        return Ok(profile);
    }

    [HttpPut]
    public async Task<ActionResult<CompanyProfileDto>> UpdateCompanyProfile([FromBody] CompanyProfileDto dto)
    {
        var updated = await _mediator.Send(new UpdateCompanyProfileCommand(dto));
        return Ok(updated);
    }
}
