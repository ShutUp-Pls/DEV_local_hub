// components/Alert.tsx

interface AlertProps {
  message: string;
  type: "success" | "error";
}

const Alert = ({ message, type }: AlertProps) => {
  if (!message) return null;

  const styles = {
    success: "bg-green-900/30 text-green-400 border-green-800",
    error: "bg-red-900/30 text-red-400 border-red-800",
  };

  return (
    <div className={`${styles[type]} p-4 rounded-xl mb-6 border`}>
      {message}
    </div>
  );
};

export default Alert;