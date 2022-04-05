import { toast } from "react-toastify";

const toastConfig = {
  position: toast.POSITION.TOP_RIGHT,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

const notify = (message, type = "success") => {
  switch (type) {
    case type === "success":
      toast.success(message);
    case type === "error":
      toast.error(message, toastConfig);
    case type === "warn":
      toast.warn(message, toastConfig);
    case type === "info":
      toast.info(message, toastConfig);
    default:
      toast(message, toastConfig);
  }
};

export default notify;