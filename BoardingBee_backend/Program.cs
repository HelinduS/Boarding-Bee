using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;
using DotNetEnv;
using BoardingBee_backend.Auth.Services;

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddScoped<IAuthService, AuthService>();

// DB connection (SQL Server). Set DB_CONNECTION_STRING env var.
var connectionString = "Server=tcp:boardingbee.database.windows.net,1433;Initial Catalog=BoardingBeeDB;Persist Security Info=False;User ID=boardingbee;Password=#Boarding1234;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));

// CORS for Next.js dev
builder.Services.AddCors(options =>
{
    options.AddPolicy("NextJs", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("NextJs");

// Serve wwwroot for uploaded avatars
app.UseStaticFiles();

app.UseAuthorization();
app.MapControllers();

await app.RunAsync();
