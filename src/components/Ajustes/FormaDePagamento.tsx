import React, { useState, useEffect, FormEvent } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface PaymentForm {
  id: number;
  name: string;
  type: "Outros" | "À vista" | "Parcelado";
  active: boolean;
  quantity: number | null;
}

const MinimalResponsiveForm: React.FC = () => {
  const [paymentForms, setPaymentForms] = useState<PaymentForm[]>([]);
  const [formState, setFormState] = useState<PaymentForm>({
    id: 0,
    name: "",
    type: "Outros",
    active: true,
    quantity: null,
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch the payment forms when the component mounts
  useEffect(() => {
    const fetchPaymentForms = async () => {
      const chave = localStorage.getItem("codigo_verificacao");
      const nomeBanco = localStorage.getItem("nome_banco");

      if (!chave || !nomeBanco) {
        toast.error(
          "Chave de verificação ou nome do banco não encontrados no localStorage.",
        );
        return;
      }

      try {
        const response = await fetch("/api/payment-forms", {
          method: "GET",
          headers: {
            "x-verificacao-chave": chave,
            "x-nome-banco": nomeBanco,
          },
        });

        if (!response.ok) {
          toast.error("Erro ao buscar formas de pagamento.");
          return;
        }

        const data = await response.json();

        // Verifique se há uma mensagem
        if (data.message) {
          toast.info(data.message); // Exibe mensagem se nenhuma forma for encontrada
        } else {
          setPaymentForms(data); // Atualize o estado com os dados da resposta
        }
      } catch (error) {
        toast.error("Erro ao buscar formas de pagamento.");
      }
    };

    fetchPaymentForms();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]:
        name === "quantity" ? (value ? parseInt(value, 10) : null) : value,
    }));
  };

  const handleCheckboxChange = () => {
    setFormState((prev) => ({ ...prev, active: !prev.active }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const chave = localStorage.getItem("codigo_verificacao");
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!chave || !nomeBanco) {
      toast.error(
        "Chave de verificação ou nome do banco não encontrados no localStorage.",
      );
      return;
    }

    try {
      const response = await fetch("/api/payment-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-verificacao-chave": chave,
          "x-nome-banco": nomeBanco,
        },
        body: JSON.stringify(formState),
      });

      if (!response.ok) throw new Error("Failed to submit form");
      const data = await response.json();
      toast.success(data.message);
      setPaymentForms((prev) => [...prev, data.form]);
      setFormState({
        id: 0,
        name: "",
        type: "Outros",
        active: true,
        quantity: null,
      });
    } catch (error) {
      toast.error("Error ao adicionar forma de pagamento.");
    }
  };

  return (
    <div className="p-5">
      <ToastContainer />
      <h1 className="mb-4 text-2xl font-semibold">Formas de Pagamento</h1>
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col space-y-4">
        <input
          type="text"
          name="name"
          value={formState.name}
          onChange={handleChange}
          placeholder="Nome da forma de pagamento"
          className="rounded border border-gray-300 p-2"
        />
        <select
          name="type"
          value={formState.type}
          onChange={handleChange}
          className="rounded border border-gray-300 p-2"
        >
          <option value="Outros">Outros</option>
          <option value="À vista">À vista</option>
          <option value="Parcelado">Parcelado</option>
        </select>
        <input
          type="number"
          name="quantity"
          value={formState.quantity || ""}
          onChange={handleChange}
          placeholder="Quantidade de parcelas"
          className="rounded border border-gray-300 p-2"
        />
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formState.active}
            onChange={handleCheckboxChange}
            className="mr-2"
          />
          Ativo
        </label>
        <button type="submit" className="rounded bg-blue-500 p-2 text-white">
          Adicionar Forma de Pagamento
        </button>
      </form>

      <div>
        <h2 className="mb-4 text-xl font-semibold">
          Formas de Pagamento Existentes
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paymentForms.length === 0 ? (
            <p className="text-center text-gray-500">
              Nenhuma forma de pagamento encontrada.
            </p>
          ) : (
            paymentForms.map((paymentForm) => (
              <div
                key={paymentForm.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-md"
              >
                <h3 className="text-lg font-semibold">{paymentForm.name}</h3>
                <p className="text-gray-500">Tipo: {paymentForm.type}</p>
                <p
                  className={`text-${paymentForm.active ? "green" : "red"}-500`}
                >
                  Status: {paymentForm.active ? "Ativo" : "Inativo"}
                </p>
                <p>Parcelas: {paymentForm.quantity || "N/A"}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MinimalResponsiveForm;
