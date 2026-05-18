import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface TelegramContextType {
  telegramDisconnected: boolean;
  hideNotification: () => void;
  refreshTelegramStatus: () => void;
}

const TelegramNotificationContext =
  createContext<TelegramContextType>({
    telegramDisconnected: false,
    hideNotification: () => {},
    refreshTelegramStatus: () => {},
  });

export const useTelegramNotification = () =>
  useContext(TelegramNotificationContext);

export const TelegramNotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {

  const [telegramDisconnected, setTelegramDisconnected] =
    useState(false);

  const checkTelegramStatus = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setTelegramDisconnected(false);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/telegram/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      console.log("TELEGRAM STATUS:", data);

      setTelegramDisconnected(!data.connected);

    } catch (err) {
      console.error(err);

      setTelegramDisconnected(true);
    }
  };

  useEffect(() => {
    checkTelegramStatus();

    // ✅ CHECK EVERY 5 SECONDS
    const interval = setInterval(() => {
      checkTelegramStatus();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

  // ❌ DO NOTHING NOW
  const hideNotification = () => {};

  return (
    <TelegramNotificationContext.Provider
      value={{
        telegramDisconnected,

        hideNotification,

        refreshTelegramStatus:
          checkTelegramStatus,
      }}
    >
      {children}
    </TelegramNotificationContext.Provider>
  );
};