import React, { useState } from "react";

type Permission = {
  name: string;
  enabled: boolean;
};

type Permissions = {
  pages: Permission[];
  functions: Permission[];
};

const PermissionManager: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [permissions, setPermissions] = useState<Permissions>({
    pages: [
      { name: "Relatórios", enabled: false },
      { name: "Usuários", enabled: false },
      { name: "Membros", enabled: false },
      { name: "Financeiro", enabled: false },
    ],
    functions: [], // Pode adicionar funções específicas aqui no futuro
  });

  const togglePermission = (category: keyof Permissions, index: number) => {
    setPermissions((prevPermissions) => {
      const updatedCategory = prevPermissions[category].map((perm, i) => {
        if (i === index) {
          return { ...perm, enabled: !perm.enabled };
        }
        return perm;
      });

      return {
        ...prevPermissions,
        [category]: updatedCategory,
      };
    });
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "500px",
        margin: "auto",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Gerenciador de Permissões</h2>

      <label
        htmlFor="userName"
        style={{ display: "block", marginBottom: "10px" }}
      >
        Nome do Usuário:
        <input
          id="userName"
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Digite o nome do usuário"
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </label>

      <h3>Páginas</h3>
      <ul style={{ listStyleType: "none", padding: "0" }}>
        {permissions.pages.map((page, index) => (
          <li
            key={page.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <span>{page.name}</span>
            <label style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={page.enabled}
                onChange={() => togglePermission("pages", index)}
                style={{ marginRight: "10px" }}
              />
              {page.enabled ? "Ligado" : "Desligado"}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PermissionManager;
