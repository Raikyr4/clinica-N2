using ClinicaN2.Api.Infrastructure.Database;
using ClinicaN2.Api.Infrastructure.Repositories;
using ClinicaN2.Api.Application.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontEnd", policy =>
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddScoped<IDbConnectionFactory, NpgsqlConnectionFactory>();
builder.Services.AddScoped<PlanoRepository>();
builder.Services.AddScoped<EspecialidadeRepository>();
builder.Services.AddScoped<MedicoRepository>();
builder.Services.AddScoped<AgendaRepository>();
builder.Services.AddScoped<PacienteRepository>();
builder.Services.AddScoped<ConsultaRepository>();
builder.Services.AddScoped<ListaEsperaRepository>();

builder.Services.AddScoped<PlanoService>();
builder.Services.AddScoped<EspecialidadeService>();
builder.Services.AddScoped<MedicoService>();
builder.Services.AddScoped<AgendaService>();
builder.Services.AddScoped<PacienteService>();
builder.Services.AddScoped<ConsultaService>();
builder.Services.AddScoped<ListaEsperaService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontEnd");
app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();
