import { useState, useEffect } from "react";
import { FiBell } from "react-icons/fi"; // Ícone de notificação do react-icons
import ClickOutside from "@/components/ClickOutside";

type Notification = {
  id: number;
  title: string;
  message: string;
  created_at: string;
  autor: string;
  read_at?: string | null; // Indica se foi lida
};

const DropdownNotification = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications`);
        const data: Notification[] = await response.json();
        setNotifications(data);

        // Define se há notificações não lidas
        setNotifying(data.some((n) => !n.read_at));
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );
    setNotifying(notifications.some((n) => !n.read_at));
  };

  const openNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    markAsRead(notification.id);
  };

  const closeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setNotifying(notifications.some((n) => !n.read_at));
  };

  return (
    <>
      <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
        >
          <span
            className={`absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-meta-1 ${
              notifying ? "inline" : "hidden"
            }`}
          >
            <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75"></span>
          </span>
          <FiBell className="text-xl text-gray-500 dark:text-white" />
        </button>

        {dropdownOpen && (
          <div
            className={`absolute -right-27 mt-2.5 flex h-90 w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80`}
          >
            <div className="px-4.5 py-3">
              <h5 className="text-sm font-medium text-media">Notificações</h5>
            </div>

            <ul className="flex h-auto flex-col overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <div className="flex flex-col gap-2.5 border-t border-stroke px-4.5 py-3 dark:border-strokedark">
                    <p className="text-sm">
                      <span className="text-black dark:text-white">
                        {notification.title}
                      </span>{" "}
                      {notification.message.slice(0, 50)}...
                    </p>
                    <p className="text-xs">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openNotification(notification)}
                        className="rounded-md bg-media px-4 py-2 text-xs font-bold text-white hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-media focus:ring-opacity-50"
                      >
                        Abrir
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </ClickOutside>

      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-1/3 rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark">
            <h2 className="text-lg font-bold text-forte">
              {selectedNotification.title}
            </h2>
            <p className="mt-4 text-sm text-black">
              {selectedNotification.message}
            </p>
            <p className="mt-6 text-xs text-gray-700">
              {" "}
              {new Date(selectedNotification.created_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-700">
              {selectedNotification.autor}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-opacity-90"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DropdownNotification;
