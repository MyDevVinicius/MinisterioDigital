"use client";

import React, { useState, useEffect } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  permissions: Permissions;
};

type Permission = {
  name: string;
  enabled: boolean;
};

type Permissions = {
  [key: string]: {
    name: string;
    functions: Permission[];
  };
};

const PermissionManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [isSaving, setIsSaving] = useState(false);

  // Permissões disponíveis para todos os usuários
  const allAvailablePermissions: Permissions = {
    Relatórios: {
      name: "Relatórios",
      functions: [{ name: "Gerar Relatório", enabled: false }],
    },
    Usuários: {
      name: "Usuários",
      functions: [
        { name: "Adicionar Usuário", enabled: false },
        { name: "Editar Usuário", enabled: false },
        { name: "Remover Usuário", enabled: false },
      ],
    },
    Membros: {
      name: "Membros",
      functions: [
        { name: "Adicionar Membro", enabled: false },
        { name: "Excluir Membro", enabled: false },
        { name: "Editar Membro", enabled: false },
      ],
    },
    Financeiro: {
      name: "Financeiro",
      functions: [
        { name: "Entradas", enabled: false },
        { name: "Saídas", enabled: false },
        { name: "Editar Contas", enabled: false },
        { name: "Excluir Contas", enabled: false },
      ],
    },
    Permissões: {
      name: "Permissões",
      functions: [
        { name: "Visualizar Permissões", enabled: false },
        { name: "Alterar Permissões", enabled: false },
      ],
    },
    Dashboard: {
      name: "Dashboard",
      functions: [
        { name: "Visualizar Dashboard", enabled: false },
        { name: "Configurar Dashboard", enabled: false },
      ],
    },
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const codigoVerificacao = localStorage.getItem("codigo_verificacao");
      const nomeBanco = localStorage.getItem("nome_banco");

      if (!codigoVerificacao || !nomeBanco) {
        console.error(
          "Código de verificação ou nome do banco não encontrado no localStorage",
        );
        return;
      }

      try {
        const response = await fetch("/api/permissionsuser", {
          method: "GET",
          headers: {
            "x-verificacao-chave": codigoVerificacao,
            "x-nome-banco": nomeBanco,
          },
        });
        const data = await response.json();
        setUsers(data || []);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = Number(event.target.value);
    const selectedUser = users.find((user) => user.id === userId);

    setSelectedUser(userId);

    if (selectedUser) {
      const userPermissions =
        selectedUser.permissions &&
        Object.keys(selectedUser.permissions).length > 0
          ? selectedUser.permissions
          : allAvailablePermissions;

      // Combine default permissions with user's permissions, disabling those not present for the user
      const combinedPermissions = Object.keys(allAvailablePermissions).reduce(
        (acc, pageKey) => {
          const defaultPage = allAvailablePermissions[pageKey];
          const userPage = userPermissions[pageKey] || { functions: [] };
          const combinedFunctions = defaultPage.functions.map((defaultFunc) => {
            const userFunc = userPage.functions.find(
              (f) => f.name === defaultFunc.name,
            ) || { enabled: false };
            return { ...defaultFunc, enabled: userFunc.enabled };
          });
          acc[pageKey] = { ...defaultPage, functions: combinedFunctions };
          return acc;
        },
        {} as Permissions,
      );

      setPermissions(combinedPermissions);
    }
  };

  const togglePermission = (pageKey: string, functionIndex: number) => {
    setPermissions((prevPermissions) => {
      const updatedFunctions = prevPermissions[pageKey].functions.map(
        (func, i) => {
          if (i === functionIndex) {
            return { ...func, enabled: !func.enabled };
          }
          return func;
        },
      );

      return {
        ...prevPermissions,
        [pageKey]: {
          ...prevPermissions[pageKey],
          functions: updatedFunctions,
        },
      };
    });
  };

  const savePermissions = async () => {
    if (selectedUser === null) return;

    const codigoVerificacao = localStorage.getItem("codigo_verificacao");
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!codigoVerificacao || !nomeBanco) {
      console.error(
        "Código de verificação ou nome do banco não encontrado no localStorage",
      );
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/editPermissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-verificacao-chave": codigoVerificacao,
          "x-nome-banco": nomeBanco,
        },
        body: JSON.stringify({
          userId: selectedUser,
          permissions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Permissões atualizadas com sucesso:", data);
      } else {
        console.error("Erro ao atualizar permissões:", data.message);
      }
    } catch (error) {
      console.error("Erro ao atualizar permissões:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full px-4 py-8">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Gerenciador de Permissões
        </h1>

        {/* Seleção de Usuário */}
        <div className="mb-6">
          <label
            htmlFor="userSelect"
            className="block text-sm font-medium text-gray-700"
          >
            Selecionar Usuário:
          </label>
          <select
            id="userSelect"
            value={selectedUser || ""}
            onChange={handleUserChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="" disabled>
              Escolha um usuário
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Permissões */}
        <div>
          {Object.entries(permissions).length > 0 ? (
            Object.entries(permissions).map(([pageKey, pageData]) => (
              <div key={pageKey} className="mb-8">
                <h2 className="mb-4 text-xl font-medium">{pageData.name}</h2>
                {pageData.functions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pageData.functions.map((func, index) => (
                      <div
                        key={func.name}
                        className="flex items-center justify-between rounded-lg bg-gray-100 p-5 shadow-sm transition-shadow duration-200 hover:shadow-lg"
                      >
                        <span className="w-fit font-medium text-gray-800">
                          {func.name}
                        </span>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={func.enabled}
                            onChange={() => togglePermission(pageKey, index)}
                          />
                          <div className="h-5 w-8 rounded-full bg-gray-200 transition-all peer-checked:bg-green-500 peer-checked:after:translate-x-3"></div>
                          <div className="h-4 w-4 rounded-full bg-white shadow-md transition-all peer-checked:translate-x-3"></div>
                        </label>
                        {/* Texto que indica se a permissão está ativada ou desativada */}
                        <span className="ml-4 text-sm font-medium text-gray-600">
                          {func.enabled ? "Ativado" : "Desativado"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Nenhuma função disponível para esta página.
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              Nenhuma permissão configurada para este usuário.
            </p>
          )}
        </div>
      </div>

      {/* Botão Salvar Alterações */}

      <div className="mt-8 text-center">
        <button
          onClick={savePermissions}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          disabled={isSaving}
        >
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </div>
  );
};

export default PermissionManager;
