using ClinicaN2.Api.Application.DTOs;
using ClinicaN2.Api.Infrastructure.Repositories;

namespace ClinicaN2.Api.Application.Services;

public sealed class PacienteService(PacienteRepository repository)
{
    public async Task<IReadOnlyList<PacienteDto>> BuscarAsync(string nome, string nomeMae, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(nome) || string.IsNullOrWhiteSpace(nomeMae))
            throw new ArgumentException("Informe nome do paciente e nome da mae.");

        var pacientes = await repository.BuscarAsync(nome.Trim(), nomeMae.Trim(), cancellationToken);

        if (pacientes.Count == 0)
            throw new InvalidOperationException("Paciente nao encontrado. Cadastre o paciente para continuar.");

        return pacientes;
    }

    public Task<PacienteDto> CadastrarAsync(CadastrarPacienteRequest request, CancellationToken cancellationToken)
    {
        ValidarPaciente(request);
        return repository.CadastrarAsync(request, cancellationToken);
    }

    private static void ValidarPaciente(CadastrarPacienteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nome) || string.IsNullOrWhiteSpace(request.NomeMae))
            throw new ArgumentException("Nome e nome da mae sao obrigatorios.");

        if (request.Sexo is not ("F" or "M"))
            throw new ArgumentException("Sexo deve ser F ou M.");

        var idade = CalcularIdade(request.DataNasc);

        if (idade >= 18 && string.IsNullOrWhiteSpace(request.Cpf))
            throw new ArgumentException("CPF e obrigatorio para paciente maior de idade.");

        if (idade < 18 &&
            (string.IsNullOrWhiteSpace(request.NomeResponsavel) ||
             string.IsNullOrWhiteSpace(request.GrauParentesco) ||
             string.IsNullOrWhiteSpace(request.TelefoneResponsavel)))
        {
            throw new ArgumentException("Responsavel, grau de parentesco e telefone do responsavel sao obrigatorios para menor de idade.");
        }
    }

    private static int CalcularIdade(DateOnly nascimento)
    {
        var hoje = DateOnly.FromDateTime(DateTime.Today);
        var idade = hoje.Year - nascimento.Year;
        if (nascimento.AddYears(idade) > hoje) idade--;
        return idade;
    }
}
