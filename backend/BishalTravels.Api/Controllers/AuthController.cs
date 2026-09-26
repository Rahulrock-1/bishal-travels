using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BishalTravels.Api.Data;
using BishalTravels.Api.DTOs;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly BishalTravelsDbContext _context;

    public AuthController(BishalTravelsDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new LoginResponse(false, "Email and password are required.", null, null));
        }

        var normalizedEmail = request.Email.Trim().ToLower();

        // 1. Check database users
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user != null && DbInitializer.VerifyPassword(request.Password, user.PasswordHash))
        {
            var authUser = new AuthUserDto(user.Name, user.Email, user.Role);
            var token = Guid.NewGuid().ToString("N");
            return Ok(new LoginResponse(true, null, authUser, token));
        }

        // 2. Fallback to master admin credential check
        if (normalizedEmail == "biswajitpramanikrock@gmail.com" && request.Password == "Biswajit@1989")
        {
            var authUser = new AuthUserDto("Biswajit Pramanik", "biswajitpramanikrock@gmail.com", "Administrator / Owner");
            var token = Guid.NewGuid().ToString("N");
            return Ok(new LoginResponse(true, null, authUser, token));
        }

        return Unauthorized(new LoginResponse(false, "Invalid email address or password.", null, null));
    }

    [HttpGet("me")]
    public ActionResult<AuthUserDto> GetCurrentUser()
    {
        return Ok(new AuthUserDto("Biswajit Pramanik", "biswajitpramanikrock@gmail.com", "Administrator / Owner"));
    }
}
