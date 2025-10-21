using BoardingBee_backend.Models;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Auth.Services;
using Microsoft.AspNetCore.Mvc;

namespace BoardingBee_backend.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Handles authentication endpoints for login and registration.
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

    // Constructor injecting the authentication service.
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

    // Authenticates a user and returns a JWT token if successful.
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Identifier) && string.IsNullOrEmpty(request.Password))
                return BadRequest(new { message = "Identifier and password are required." });
            if (string.IsNullOrEmpty(request.Identifier))
                return BadRequest(new { message = "Identifier is required." });
            if (string.IsNullOrEmpty(request.Password))
                return BadRequest(new { message = "Password is required." });

            var user = _authService.GetUserByIdentifier(request.Identifier);
            if (user == null)
                return Unauthorized(new { message = "User not found." });
            if (!_authService.VerifyPassword(request.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid password." });

            var token = _authService.GenerateJwtToken(user);
            return Ok(new { token, role = user.Role });
        }

    // Registers a new user if username and email are unique.
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request, [FromServices] AppDbContext db)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Username and password are required." });
            }
            if (await db.Users.AnyAsync(u => u.Username == request.Username || u.Email == request.Email))
            {
                return BadRequest(new { message = "Username or email already exists." });
            }

            var user = new BoardingBee_backend.Models.User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = _authService.HashPassword(request.Password),
                PhoneNumber = request.PhoneNumber,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PermanentAddress = request.PermanentAddress,
                Gender = request.Gender,
                EmergencyContact = request.EmergencyContact,
                UserType = request.UserType,
                Role = string.IsNullOrWhiteSpace(request.Role) ? "User" : request.Role,
                InstitutionCompany = request.InstitutionCompany,
                Location = request.Location,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Ok(new { message = "Registration successful." });
        }

        public class RegisterRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string? PhoneNumber { get; set; }
            public string FirstName { get; set; } = string.Empty;
            public string LastName { get; set; } = string.Empty;
            public string PermanentAddress { get; set; } = string.Empty;
            public string Gender { get; set; } = string.Empty;
            public string EmergencyContact { get; set; } = string.Empty;
            public string UserType { get; set; } = string.Empty;
            public string InstitutionCompany { get; set; } = string.Empty;
            public string Location { get; set; } = string.Empty;
            public string Role { get; set; } = string.Empty;
        }
    }

    // Login request model that accepts either username or email as the identifier
    public class LoginRequest
    {
        public string? Identifier { get; set; } // username or email
        public string? Password { get; set; }
    }
}
