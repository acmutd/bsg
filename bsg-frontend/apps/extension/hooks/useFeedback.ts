import { useState } from "react";

const useFeedback = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return {
    modalOpen,
    setModalOpen,
    openModal,
    closeModal,
  };
};

export default useFeedback;