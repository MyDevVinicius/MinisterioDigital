import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarDropdownProps {
  item: any[]; // Defina um tipo mais específico aqui para a estrutura de `item`
}

const SidebarDropdown: React.FC<SidebarDropdownProps> = ({ item }) => {
  const pathname = usePathname();

  return (
    <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
      {item.map((subItem, index) => (
        <li key={index}>
          <Link
            href={subItem.route || "#"} // Fallback para evitar erro caso não haja uma rota
            className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
              pathname === subItem.route ? "text-white" : ""
            }`}
          >
            {subItem.label}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default SidebarDropdown;
