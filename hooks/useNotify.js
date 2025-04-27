import { useMessage } from "@/providers/MessageProvider";

export default function useNotify() {
  const { message } = useMessage();

  const notify = {
    loading: (msg) => {
      message.destroy();
      message.loading(msg, 0);
    },
    success: (msg) => {
      message.destroy();
      message.success(msg);
    },
    error: (msg) => {
      message.destroy();
      message.error(msg);
    },
    warning: (msg) => {
      message.destroy();
      message.warning(msg);
    },
    info: (msg) => {
      message.destroy();
      message.info(msg);
    },
    destroy: () => {
      message.destroy();
    },
  };

  return notify;
}
