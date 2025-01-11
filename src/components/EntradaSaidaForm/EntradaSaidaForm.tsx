import React, { useState, useEffect, FormEvent } from "react";
import styled from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Tipagem da entrada/saída
interface EntradaSaida {
  observacao: string;
  tipoTransacao: "Entrada" | "Saida";
  tipo:
    | "Dizimo"
    | "Oferta"
    | "Doacao"
    | "Campanha"
    | "Pagamento"
    | "Salario"
    | "Ajuda de Custo";
  formaPagamento: "Dinheiro" | "PIX" | "Debito" | "Credito";
  valor: number;
  valorPago?: number; // Valor pago, presente apenas nas transações de saída
  dataTransacao: string;
  membroId?: number;
  usuarioEmail: string;
  dataVencimento?: string; // Data de vencimento para saídas
}

interface Membro {
  id: number;
  nome: string;
}

const Container = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
`;

const Form = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
`;

const FormGroup = styled.div`
  flex: 1 1 calc(50% - 20px);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

const Label = styled.label`
  font-size: 14px;
  color: #0b3e4d;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Input = styled.input`
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  transition: border-color 0.3s;

  &:focus {
    border-color: #0b3e4d;
    outline: none;
  }
`;

const Select = styled.select`
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  transition: border-color 0.3s;

  &:focus {
    border-color: #0b3e4d;
    outline: none;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #1c6b6e;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0b3e4d;
  }
`;

const EntradaSaidaForm: React.FC = () => {
  const [formData, setFormData] = useState<EntradaSaida>({
    observacao: "",
    tipoTransacao: "Entrada",
    tipo: "Dizimo",
    formaPagamento: "Dinheiro",
    valor: 0,
    valorPago: 0, // Valor pago inicialmente é 0
    dataTransacao: new Date().toISOString().slice(0, 19),
    usuarioEmail: localStorage.getItem("email_usuario") || "",
    dataVencimento: "", // Data de vencimento vazia por padrão
  });

  const [membros, setMembros] = useState<Membro[]>([]);

  useEffect(() => {
    const fetchMembros = async () => {
      try {
        const nomeBanco = localStorage.getItem("nome_banco");
        const chaveVerificacao = localStorage.getItem("codigo_verificacao");

        if (!nomeBanco || !chaveVerificacao) {
          toast.error("Nome do banco ou chave de verificação não encontrados!");
          return;
        }

        const response = await fetch("/api/memberList", {
          method: "GET",
          headers: {
            "x-verificacao-chave": chaveVerificacao,
            "x-nome-banco": nomeBanco,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar membros");
        }

        const data = await response.json();
        setMembros(data.membros || []);
      } catch (error) {
        toast.error("Erro ao carregar membros.");
      }
    };

    if (formData.tipoTransacao === "Entrada") {
      fetchMembros();
    }
  }, [formData.tipoTransacao]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nomeBanco = localStorage.getItem("nome_banco");
    const chaveVerificacao = localStorage.getItem("codigo_verificacao");
    const usuarioEmail = localStorage.getItem("email");

    if (!nomeBanco || !chaveVerificacao || !usuarioEmail) {
      toast.error(
        "Nome do banco, chave de verificação ou e-mail do usuário não encontrados!",
      );
      return;
    }
    // Determinando o status da saída
    let status = "Pendente"; // Pendente por padrão

    if (formData.tipoTransacao === "Saida") {
      let dataVencimento: Date | null = null;

      if (formData.dataVencimento) {
        dataVencimento = new Date(formData.dataVencimento);
      }

      const dataAtual = new Date();
      const valorPago = formData.valorPago || 0;
      const valorTotal = formData.valor;

      // Lógica de status para saída
      if (valorPago === valorTotal) {
        status = "Pago"; // Pagamento completo
      } else if (
        valorPago > 0 &&
        valorPago < valorTotal &&
        dataVencimento &&
        dataVencimento >= dataAtual
      ) {
        status = "Pago Parcial";
      } else if (
        valorPago === 0 &&
        dataVencimento &&
        dataVencimento >= dataAtual
      ) {
        status = "Pendente"; // Não pago e dentro do prazo
      } else if (dataVencimento && dataVencimento < dataAtual) {
        status = "Vencida"; // Não pago e fora do prazo
      }
    }

    try {
      const endpoint =
        formData.tipoTransacao === "Entrada"
          ? "/api/financeiroentrada"
          : "/api/financeirosaida";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-verificacao-chave": chaveVerificacao,
          "x-nome-banco": nomeBanco,
          "x-usuario-email": usuarioEmail,
        },
        body: JSON.stringify({
          ...formData,
          status, // Passando o status determinado
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);

        // Resetar o formulário após sucesso
        setFormData({
          observacao: "",
          tipoTransacao: "Entrada",
          tipo: "Dizimo",
          formaPagamento: "Dinheiro",
          valor: 0,
          valorPago: 0,
          dataTransacao: new Date().toISOString().slice(0, 19),
          usuarioEmail,
          dataVencimento: "",
        });
      } else {
        toast.error(data.message || "Erro ao registrar transação.");
      }
    } catch (error) {
      toast.error("Erro ao enviar dados.");
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Observação</Label>
          <Input
            type="text"
            name="observacao"
            value={formData.observacao}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label>Tipo de Transação</Label>
          <Select
            name="tipoTransacao"
            value={formData.tipoTransacao}
            onChange={handleChange}
          >
            <option value="Entrada">Entrada</option>
            <option value="Saida">Saída</option>
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>Tipo</Label>
          <Select name="tipo" value={formData.tipo} onChange={handleChange}>
            <option value="Dizimo">Dízimo</option>
            <option value="Oferta">Oferta</option>
            <option value="Doacao">Doação</option>
            <option value="Campanha">Campanha</option>
            <option value="Pagamento">Pagamento</option>
            <option value="Salario">Salário</option>
            <option value="Ajuda de Custo">Ajuda de Custo</option>
          </Select>
        </FormGroup>
        {formData.tipoTransacao === "Entrada" && formData.tipo === "Dizimo" && (
          <FormGroup>
            <Label>Membro</Label>
            <Select
              name="membroId"
              value={formData.membroId || ""}
              onChange={handleChange}
            >
              <option value="">Selecione um Membro</option>
              {membros.map((membro) => (
                <option key={membro.id} value={membro.id}>
                  {membro.nome}
                </option>
              ))}
            </Select>
          </FormGroup>
        )}
        <FormGroup>
          <Label>Forma de Pagamento</Label>
          <Select
            name="formaPagamento"
            value={formData.formaPagamento}
            onChange={handleChange}
          >
            <option value="Dinheiro">Dinheiro</option>
            <option value="PIX">PIX</option>
            <option value="Debito">Débito</option>
            <option value="Credito">Crédito</option>
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>Valor</Label>
          <Input
            type="number"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            required
          />
        </FormGroup>
        {formData.tipoTransacao === "Saida" && (
          <FormGroup>
            <Label>Valor Pago</Label>
            <Input
              type="number"
              name="valorPago"
              value={formData.valorPago || ""}
              onChange={handleChange}
            />
          </FormGroup>
        )}
        {formData.tipoTransacao === "Saida" && (
          <FormGroup>
            <Label>Data de Vencimento</Label>
            <Input
              type="date"
              name="dataVencimento"
              value={formData.dataVencimento}
              onChange={handleChange}
            />
          </FormGroup>
        )}
        <FormGroup>
          <Button type="submit">Registrar Transação</Button>
        </FormGroup>
      </Form>
      <ToastContainer />
    </Container>
  );
};

export default EntradaSaidaForm;
