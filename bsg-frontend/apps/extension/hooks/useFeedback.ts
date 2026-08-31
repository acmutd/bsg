import {useState} from 'react';
 
const useFeedback = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    return { modalOpen, openModal, closeModal, setModalOpen };
};

export default useFeedback;