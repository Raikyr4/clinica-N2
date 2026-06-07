namespace ClinicaN2.Api.Application.DTOs;

public sealed record EspecialidadeDto(int Codigo, string Nome);

public sealed record MedicoDto(int Crm, string Nome, string? Email, string? Telefone);

public sealed record PlanoSaudeDto(int Codigo, string Nome);

public sealed record AgendaDisponivelDto(
    int CrmMedico,
    string NomeMedico,
    int CodEspecialidade,
    string NomeEspecialidade,
    string Data,
    string Horario);

public sealed record PacienteDto(
    int Codigo,
    string Nome,
    string NomeMae,
    string DataNasc,
    string Sexo,
    string Endereco,
    string Telefone,
    string? Email,
    string? Cpf,
    string? NomeResponsavel,
    string? GrauParentesco,
    string? TelefoneResponsavel,
    string? PlanoSaude);

public sealed record CadastrarPacienteRequest(
    string Nome,
    string NomeMae,
    DateOnly DataNasc,
    string Sexo,
    string Endereco,
    string Telefone,
    string? Email,
    string? Cpf,
    string? NomeResponsavel,
    string? GrauParentesco,
    string? TelefoneResponsavel,
    int? CodPlanoSaude,
    string? NumeroCarteirinha);

public sealed record RegistrarOpcaoRequest(
    int CrmMedico,
    int CodEspecialidade,
    DateOnly Data,
    TimeOnly Horario);

public sealed record ConfirmarConsultaRequest(
    int CrmMedico,
    int CodEspecialidade,
    DateOnly Data,
    TimeOnly Horario,
    int CodPaciente,
    string Tipo,
    int? CodPlanoSaude);

public sealed record ComprovanteAgendamentoDto(
    long Codigo,
    string Data,
    string Horario,
    int CrmMedico,
    string NomeMedico,
    string NomeEspecialidade,
    int CodPaciente,
    string NomePaciente,
    string Situacao,
    string Modalidade,
    string? PlanoSaude);

public sealed record ListaEsperaRequest(int CodPaciente, int CrmMedico, int CodEspecialidade);

public sealed record ListaEsperaResponse(int PosicaoFila);

public sealed record ErroResponse(string Mensagem);
